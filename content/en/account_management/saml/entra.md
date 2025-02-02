---
title: Microsoft Entra ID SAML IdP
aliases:
  - /account_management/saml/azure/
  - /account_management/faq/how-do-i-configure-azure-ad-as-a-saml-idp/
further_reading:
- link: "/account_management/saml/"
  tag: "Documentation"
  text: "Configure SAML for your Datadog account"
- link: "/account_management/multi_organization/"
  tag: "Documentation"
  text: "Configuring Teams & Organizations with Multiple Accounts"
---

## Setup

Follow the [Microsoft Entra single sign-on (SSO) integration with Datadog][1] tutorial to configure Entra ID as a SAML identity provider (IdP). **Note**: An Entra ID subscription is required. If you don't have a subscription, sign up for a [free account][2].

### Datadog

1. Go to the [Datadog SAML page][3].

2. Choose and upload the **SAML XML Metadata** file downloaded from Microsoft.

3. You should see the messages **SAML is ready** and **Valid IdP metadata installed**:

    {{< img src="account_management/saml/SAML_Configuration___Datadog11.png" alt="SAML_Configuration___Datadog11" style="width:70%;">}}

4. Click **Enable** to start using Entra ID single sign-on with SAML:

    {{< img src="account_management/saml/SAML_Configuration___Datadog12.png" alt="SAML_Configuration___Datadog12" style="width:70%;">}}

### Advanced URL

If you are using SSO with a Datadog button or link, a sign-on URL is required:

1. Retrieve your Single Sign-on URL from the [Datadog SAML page][3]:

    {{< img src="account_management/saml/SAML_Configuration___Datadog13.png" alt="SAML_Configuration___Datadog13" style="width:70%;">}}

2. In Microsoft Entra ID, navigate to the SSO Configuration section of your application, check **Show advanced URL settings**, and add your single sign-on URL.

## Further Reading

{{< partial name="whats-next/whats-next.html" >}}

[1]: https://learn.microsoft.com/en-us/entra/identity/saas-apps/datadog-tutorial
[2]: https://azure.microsoft.com/free/
[3]: https://app.datadoghq.com/saml/saml_setup
