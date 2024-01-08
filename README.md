<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_dark.svg" />
     <img src="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
<p align="center">
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license"></a>

> [!WARNING]
> This integration is in Beta

# Fingerprint Pro Fastly Proxy Integration

[Fingerprint](https://fingerprint.com) is a device intelligence platform offering 99.5% accurate visitor identification.

Fingerprint Fastly Proxy Integration is responsible for proxying identification and agent-download requests between your website and Fingerprint through your Fastly infrastructure. The integration uses [Fastly Compute services](https://www.fastly.com/products/compute).

## 🚧 Requirements and expectations

* **Integration in Beta**: Please report any issues to our support team.

* **Limited to Enterprise plan**: The Fastly Proxy Integration is accessible and exclusively supported for customers on the **Enterprise** Plan. Other customers are encouraged to use [Custom subdomain setup](https://dev.fingerprint.com/docs/custom-subdomain-setup) or [Cloudflare Proxy Integration](https://dev.fingerprint.com/docs/cloudflare-integration).

* **Manual updates occasionally required**: The underlying data contract in the identification logic can change to keep up with browser updates. Using the Fastly Proxy Integration might require occasional manual updates on your side. Ignoring these updates will lead to lower accuracy or service disruption.

## How to install

You need a Fastly account to use the integration. You must [create a Fastly account](https://www.fastly.com/signup) if you don't already have one.

### Preparation

1. Create your Proxy Secret on Fingerprint dashboard. 
    - Go to the Fingerprint [dashboard](https://dashboard.fingerprint.com/) and select your application.
    - In the left menu, click _App settings_ and switch to the _API keys_ tab.
    - Click **Create Proxy Key**.
    - Input `Fastly Integration` for the name field.
    - Click **Create API Key**.
2. Make decision for agent download path and identification path. Examples: `/463n7-d0wnl04d` for agent download and `/1d3n71f1c4710n-r35ul7` for identification. Make sure they are randomized.

### Generate an API Token

[Create an API Token](https://docs.fastly.com/en/guides/using-api-tokens) in your Fastly dashboard for authentication. Make sure the token has `global` scope. Name your token `Fingerprint`.

### Install Fastly CLI

Follow [this guide](https://developer.fastly.com/learning/compute/#install-the-fastly-cli) to install the Fastly CLI and authenticate. You will use the API Token from previous step

### Clone the repository and install dependencies

Clone [Fingerprint Pro Fastly Proxy Integration](https://github.com/fingerprintjs/fingerprint-pro-fastly-proxy-integration) repo to your local machine. After it is done, run `yarn install`.

### Add author email

Go to `fastly.toml` file and add your email to `authors` field. The line `authors = []` becomes `authors = ["my-eamil@my-company.com"]` assuming `my-email@my-company.com` is your email address.

### Deploy the service

Run `yarn deploy`. It will prompt to create a new service, type `y` to create a new service and type `fingerprint-pro-fastly-proxy-integration` for the service name. Skip through the rest of the prompts by pressing enter. This will create the service under one of Fastly's domains, `{host}.edgecompute.app`. We will change this later.

### Create a domain for the service

Fastly Compute services need a domain for access. You may use a subdomain of your main website. If you like to use an apex domain, follow [this guide](https://docs.fastly.com/en/guides/using-fastly-with-apex-domains).

Pick a domain for Fingerprint Fastly service to use. Refrain from using the word `fingerprint` or `fpjs` in the subdomain. An example could be `metrics.yourwebsite.com`.

1. Go to [Fastly dashboard](https://manage.fastly.com/secure)'s **Secure** page, select **TLS management**.
2. Click **Secure domain** or **Secure another domain**. Select **Use certificates Fastly obtains for you**.
3. Enter your domain and click **Add**.
4. Configure Certification authority and TLS configuration according to your needs. Click **Submit**.
5. Follow the instructions to validate the ownership of the domain.
6. After the validation is done, find your domain in [the list of domains](https://manage.fastly.com/network/domains), click **view details** and see the CNAME record which is in the form of `{letter}.sni.global.fastly.net`. Create a CNAME record for this value via your DNS provider.

### Add the domain

1. Go to Fingerprint service in [Fastly dashboard](https://manage.fastly.com/services/all) and select latest editable version. If you don't have a editable version, click **Edit Configuration** and **Clone version N (active) to edit** to create an editable version of the service. 
2. Click `Domains` on the left menu.
3. Click **Create Domain**, type the domain you've previously created.
4. Click **Add** to save changes.

### Add backends

We will add two backends, `fpcdn.io` and `api.fpjs.io`. 

1. Go to Fingerprint service in [Fastly dashboard](https://manage.fastly.com/services/all) and select latest editable version.
2. Click **Origins** on the left menu.
3. Click **Create Host**, type `fpcdn.io` and click **Add**.
4. Click edit on the previously created host. Change its name to `fpcdn`. Scroll down to find **Override host** field and input `fpcdn.io`. Click **Update** to save changes.
5. Click **Create Host**, type `api.fpis.io` and click **Add**.
6. Click edit on the previously created host. Change its name to `fpjs`. Scroll down to find **Override host** field and input `api.fpjs.io`. Click **Update** to save changes.

> [!WARNING]
> If you are using a different region than US with Fingerprint, then you must input corresponding endpoints, `eu.api.fpjs.io` for EU region and `ap.api.fpjs.io` for AP region.

### Add config store

1. Go to [Resources tab](https://manage.fastly.com/resources/config-stores).
2. Click **Create a config store**. Input **Fingerprint** as the name of the config store.
3. Click on **Link to services**, select `fingerprint-pro-fastly-proxy-integration`, click **Next** and click **Link only**. Click **Finish**.
4. Find the config stored named **Fingerprint**, click **Key-value pairs** and add the values from the [preparation](#preparation) step:
   - `AGENT_SCRIPT_DOWNLOAD_PATH` as the key and your agent download path as the value.
   - `GET_RESULT_PATH` as the key and your identification path as the value.
   - `PROXY_SECRET` as the key and your Fingerprint proxy secret as the value.

### Activate the service

1. Go to Fingerprint service in [Fastly dashboard](https://manage.fastly.com/services/all) and select latest editable version.
2. Click **Activate** (if you see **Validating** instead, wait for it to complete).

Wait for a couple of minutes for activation and then the installation is complete.

## How to use

Configure the Fingerprint client agent to make requests to your integration instead of the default Fingerprint APIs.

- Set endpoint to the path of your identification proxy endpoint, for example, `https://YOUR_DOMAIN/YOUR_IDENTIFICATION_PATH`.
- For browsers and web-based mobile applications, set the `scriptUrlPattern` to the path of your agent-download proxy endpoint, for example, `https://YOUR_DOMAIN/YOUR_AGENT_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>`.
    - Keep the query parameters as displayed here, including `<` and `>`.
    - The CDN installation method pattern looks slightly different: `https://metrics.yourwebsite.com/YOUR_AGENT_PATH?apiKey=PUBLIC_API_KEY`, see the full code examples below.

```js
// Pro JS Agent (NPM)
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro'

// Initialize the agent at application startup.
const fpPromise = FingerprintJS.load({
    apiKey: your-public-api-key,
    scriptUrlPattern: [
        'https://YOUR_DOMAIN/YOUR_AGENT_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>',
        FingerprintJS.defaultScriptUrlPattern, // Fallback to default CDN in case of error
    ],
    endpoint: [
        'https://YOUR_DOMAIN/YOUR_IDENTIFICATION_PATH',
        FingerprintJS.defaultEndpoint // Fallback to default endpoint in case of error
    ],
});
```
```js
// Pro JS Agent (CDN)
const url = 'https://YOUR_DOMAIN/YOUR_AGENT_PATH?apiKey=your-public-api-key';
const fpPromise = import(url).then((FingerprintJS) =>
    FingerprintJS.load({
        endpoint: [
            'https://YOUR_DOMAIN/YOUR_IDENTIFICATION_PATH',
            FingerprintJS.defaultEndpoint, // Fallback to default endpoint in case of error
        ],
    })
);
```

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/fingerprintjs/fingerprint-pro-fastly-proxy-integration/blob/main/LICENSE) file for more info.
