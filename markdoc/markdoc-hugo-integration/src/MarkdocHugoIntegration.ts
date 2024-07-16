import fs from 'fs';
import { PrefOptionsConfig } from './schemas/yaml/prefOptions';
import { validatePlaceholders } from './helpers/frontmatterValidation';
import {
  loadPrefOptionsFromDir,
  loadSitewidePrefsConfigFromFile,
  getDefaultValuesByPrefId
} from './helpers/configIngestion';
import {
  parseMarkdocFile,
  collectVarIdsFromTree,
  ParsingErrorReport
} from './helpers/compilation';
import MarkdocStaticCompiler from 'markdoc-static-compiler';
import { findInDir } from './helpers/filesystem';
import prettier from 'prettier';

export class MarkdocHugoIntegration {
  prefOptionsConfig: PrefOptionsConfig;
  sitewidePrefNames: string[] = [];
  markdocFiles: string[] = [];
  partialsDir: string;
  // Errors from the AST parsing process,
  // which come with some extra information, like line numbers
  parsingErrorReportsByFilePath: Record<string, ParsingErrorReport[]> = {};
  // All other errors caught during compilation
  validationErrorsByFilePath: Record<string, string> = {};

  /**
   * Ingest the available configuration files
   * and scan the content directory for Markdoc files.
   */
  constructor(p: {
    sitewidePrefsFilepath: string;
    prefOptionsConfigDir: string;
    contentDir: string;
    partialsDir: string;
  }) {
    this.prefOptionsConfig = loadPrefOptionsFromDir(p.prefOptionsConfigDir);
    this.sitewidePrefNames = loadSitewidePrefsConfigFromFile(p.sitewidePrefsFilepath);
    this.markdocFiles = findInDir(p.contentDir, /\.mdoc$/);
    this.partialsDir = p.partialsDir;
  }

  /**
   * Compile all detected Markdoc files to HTML.
   */
  compile() {
    for (const markdocFile of this.markdocFiles) {
      const { ast, frontmatter, partials, errorReports } = parseMarkdocFile(
        markdocFile,
        this.partialsDir
      );

      // if the file has errors, log the errors for later output
      // and continue to the next file
      if (errorReports.length > 0) {
        this.parsingErrorReportsByFilePath[markdocFile] = errorReports;
        continue;
      }

      // verify that all possible placeholder values
      // yield an existing options set
      try {
        validatePlaceholders(frontmatter, this.prefOptionsConfig);
      } catch (e) {
        if (e instanceof Error) {
          this.validationErrorsByFilePath[markdocFile] = e.message;
        } else if (typeof e === 'string') {
          this.validationErrorsByFilePath[markdocFile] = e;
        } else {
          this.validationErrorsByFilePath[markdocFile] = JSON.stringify(e);
        }
        continue;
      }

      // derive the default value of each preference
      const defaultValsByPrefId = getDefaultValuesByPrefId(
        frontmatter,
        this.prefOptionsConfig
      );

      const renderableTree = MarkdocStaticCompiler.transform(ast, {
        variables: defaultValsByPrefId,
        partials
      });

      // ensure that all variable ids appearing
      // in the renderable tree are valid page pref ids
      const referencedVarIds = collectVarIdsFromTree(renderableTree);
      const pagePrefIds = Object.keys(defaultValsByPrefId);
      const invalidVarIds = referencedVarIds.filter((id) => !pagePrefIds.includes(id));

      if (invalidVarIds.length > 0) {
        this.validationErrorsByFilePath[
          markdocFile
        ] = `Invalid variable IDs found in Markdoc file ${markdocFile}: ${invalidVarIds}`;
        continue;
      }

      // write the file to HTML
      const html = MarkdocStaticCompiler.renderers.html(renderableTree);
      const styledHtml = `<style>.markdoc__hidden { background-color: lightgray; }</style>${html}`;
      fs.writeFileSync(
        markdocFile.replace(/\.mdoc$/, '.html'),
        prettier.format(styledHtml, { parser: 'html' })
      );
    }

    return {
      hasErrors: this.hasErrors(),
      parsingErrorReportsByFilePath: this.parsingErrorReportsByFilePath,
      validationErrorsByFilePath: this.validationErrorsByFilePath
    };
  }

  hasErrors() {
    return (
      Object.keys(this.parsingErrorReportsByFilePath).length > 0 ||
      Object.keys(this.validationErrorsByFilePath).length > 0
    );
  }

  logErrorsToConsole() {
    const errorReportsByFilePath = this.parsingErrorReportsByFilePath;
    if (Object.keys(errorReportsByFilePath).length > 0) {
      console.error(`Syntax errors found in Markdoc files:`);

      for (const filePath in errorReportsByFilePath) {
        console.error(`\nIn file ${filePath}:`);
        errorReportsByFilePath[filePath].forEach((report) => {
          console.error(
            `  - ${report.error.message} at line(s) ${report.lines.join(', ')}`
          );
        });
      }
    }

    if (Object.keys(this.validationErrorsByFilePath).length > 0) {
      console.error(`Errors found in Markdoc files:`);

      for (const filePath in this.validationErrorsByFilePath) {
        console.error(`\nIn file ${filePath}:`);
        console.error(`  - ${this.validationErrorsByFilePath[filePath]}`);
      }
    }
  }
}
