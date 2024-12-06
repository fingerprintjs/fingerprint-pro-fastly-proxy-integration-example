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

> [!CAUTION]
> This is an example of a custom Fingerprint proxy integration with Fastly. The example is still in the **BETA** stage of development and support is provided only to specific Enterprise customers. If that is not you, do not use this example in production.

# Fingerprint Pro Fastly Proxy Integration Example

[Fingerprint](https://fingerprint.com) is a device intelligence platform offering 99.5% accurate visitor identification.

This custom Fastly Proxy Integration example is responsible for proxying identification and agent-download requests between your application and Fingerprint through your Fastly infrastructure. This example uses [Fastly Compute services](https://www.fastly.com/products/compute).

## 🚧 Requirements and expectations

* **Integration example in Beta**: Please report any issues to our support team.

* **Limited to specific Enterprise customers**: At this point, this custom integration example is accessible and exclusively supported for specific customers on the  **Enterprise** Plan. Other customers are encouraged to use [Custom subdomain setup](https://dev.fingerprint.com/docs/custom-subdomain-setup) or [Cloudflare Proxy Integration](https://dev.fingerprint.com/docs/cloudflare-integration).

* **Manual updates occasionally required**: The underlying data contract in the identification logic can change to keep up with browser updates. Using the Fastly Proxy Integration might require occasional manual updates on your side. Ignoring these updates will lead to lower accuracy or service disruption.

## How to install

This guide assumes you already have a [Fastly account](https://www.fastly.com/signup) and a [Fingerprint account](https://fingerprint.com/signup).

### 1. Create a Fingerprint Proxy Secret

1. Go to the Fingerprint [dashboard](https://dashboard.fingerprint.com/) and select your application.
2. Navigate to **App settings** > **API keys**.
3. Click **Create Proxy Key**.
4. Name the key `Fastly Integration`.
5. Click **Create API Key**.

You will use the secret to authenticate requests from your proxy integration to the Fingerprint API. 

### 2. Create a Fastly API token

1. [Create a Fastly API Token](https://docs.fastly.com/en/guides/using-api-tokens#creating-api-tokens) in your Fastly dashboard. 
2. Make sure the token has a `global` scope.
3. Name your token `Fingerprint`.
4. Note the value of your token somewhere. You will use it in the following step to deploy the proxy integration to your Fastly account.

### 3. Install and configure the Fastly CLI

1. Install the Fastly CLI on your computer following [Fastly documentation](https://www.fastly.com/documentation/guides/compute/#set-up-the-development-environment).
2. Configure the CLI profile with the token you created in the previous step:
   
    ```
    fastly profile create
    ```

### 4. Clone this repository and prepare it for deployment

1. Run `git clone git@github.com:fingerprintjs/fingerprint-pro-fastly-proxy-integration-example.git`
2. Run `cd fingerprint-pro-fastly-proxy-integration-example`
3. Run `yarn install`
4. Inside the `fastly.toml` file, add your email to the `authors` field. 

    ```diff
    - authors = []
    + authors = ["your.name@yourcompany.com"]
    ```

### 5. Deploy the service

1. Run `yarn deploy`.
2. Type `y` to create a new service.
3. You can keep `fingerprint-pro-fastly-proxy-integration` as the service name.
4. Skip through the rest of the prompts by pressing `Enter`.
  
Fastly will create the service under one of its domains, `{host}.edgecompute.app`. We will change it later. 
At this point, the service is still returning an error like `{"error":"something went wrong"}` as it requires more configuration.

### 6. Configure the service backends in Fastly

Add two backends, `fpcdn.io` and `api.fpjs.io`. 

1. Go to your Fingerprint service in the [Fastly dashboard](https://manage.fastly.com/services/all) and select the latest editable version. If you don't have an editable version, click **Edit Configuration** and **Clone version N (active) to edit** to create an editable version of the service. 
2. In the left menu, click **Origins**.
3. Click **Create Host**, type `fpcdn.io` and click **Add**.
4. Click **Edit** on the previously created host.
    - Change its name to `fpcdn`.
    - Scroll down and set **Override host** to `fpcdn.io`.
    - Click **Update** to save changes.
6. Click **Create Host**, type `api.fpjs.io` and click **Add**.
7. Click **Edit**  on the previously created host.
   - Change its name to `fpjs`.
   - Scroll down and set **Override host** to `api.fpjs.io`.
   - Click **Update** to save changes.

> [!WARNING]
> If you are not using the Global/US [Fingerprint region](https://dev.fingerprint.com/docs/regions), instead of `api.fpjs.io` use `eu.api.fpjs.io` for the EU region or `ap.api.fpjs.io` for AP region.

### 7. Add a config store to the service

Provide the proxy secret and your chosen resource paths to the service.

1. In Fastly, go to the [Resources tab](https://manage.fastly.com/resources/config-stores).
2. Click **Create a config store**.
3. Name the config store *exactly* `Fingerprint` (the store name is hard-coded in the service implementation) and click **Add**. 
4. Click **Link to services** and select `fingerprint-pro-fastly-proxy-integration`.
5. Click **Next**, select the current (draft) version of your service, and click **Link only**.
6. Click **Finish**.
7. Find your new config store and click **Key-value pairs** to add the following values:
   - set `AGENT_SCRIPT_DOWNLOAD_PATH` to your chosen agent download path. It should be something random to avoid ad blockers, for example, `463n7-d0wnl04d`.
   - set `GET_RESULT_PATH` to your chosen identification result path. It should be something random to avoid ad blockers, for example, `1d3n71f1c4710n-r35ul7`.
   - set `PROXY_SECRET` to the value of your Fingerprint proxy secret you created in Step 1.

### 8. Create a domain for the service

We recommend using a subdomain of the website you want to use Fingerprint on. Do not use `fingerprint`, `fpjs`, and other fingerprint-related terms in the subdomain to avoid ad blockers. Use something random or generic, for example: `metrics.yourwebsite.com`.

1. Navigate to the [Fastly dashboard](https://manage.fastly.com/secure) > **Secure** > **TLS Management**.
2. Click **Secure domain** or **Secure another domain**.
3. Select **Use certificates Fastly obtains for you**.
4. Enter your domain and click **Add**.
5. Configure Certification Authority and TLS configuration according to your needs and click **Submit**.
6. Follow the instructions on the screen to validate the ownership of the domain.
7. When the validation is done, find your domain in the list of [Domains](https://manage.fastly.com/network/domains).
8. Click **View details** and find the CNAME record associated with the domain in the form of `{letter}.sni.global.fastly.net`.
9. Using your DNS provider, create a CNAME record for your subdomain with this value (`CNAME metrics.yourwebsite.com -> {letter}.sni.global.fastly.net`)

### 9. Add the domain to the service

1. Go to your Fingerprint service in the [Fastly dashboard](https://manage.fastly.com/services/all) and select the latest editable version.
2. In the left menu, click **Domains**.
3. Click **Create Domain** and type the domain you've previously created.
4. Click **Add** to save changes.

### 10. Activate the service

1. Go to the Fingerprint service in [Fastly dashboard](https://manage.fastly.com/services/all) and select the latest editable version.
2. Click **Activate** (if you see **Validating** instead, wait for it to complete).

Wait a couple of minutes for the activation. You can go to `metrics.yourwebsite.com/status` to verify that your integration is running.

### 11. Configure the Fingerprint client agent to use your service

Configure the Fingerprint client agent to make requests to your integration instead of the default Fingerprint APIs.

- Set `endpoint` to the path of your `GET_RESULT_PATH` endpoint, for example, `https://metrics.yourwebsite.com/1d3n71f1c4710n-r35ul7`.
- For websites and web-based mobile applications using one of our SDKs, set the `scriptUrlPattern` to the path of your `AGENT_SCRIPT_DOWNLOAD_PATH` endpoint, for example, `https://metrics.yourwebsite.com/463n7-d0wnl04d?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>`.
    - Keep the query parameters as displayed here, including `<` and `>`.

The CDN installation method pattern looks slightly different: `https://metrics.yourwebsite.com/463n7-d0wnl04d?apiKey=PUBLIC_API_KEY`, see the full code examples below.

#### Using the Fingerprint Pro NPM Package

The same principle applies to our [client SDKs](https://dev.fingerprint.com/docs/frontend-libraries).

```js
import * as FingerprintJS from "@fingerprintjs/fingerprintjs-pro";

const fpPromise = FingerprintJS.load({
  apiKey: PUBLIC_API_KEY,
  scriptUrlPattern: [
    "https://metrics.yourwebsite.com/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>",
    FingerprintJS.defaultScriptUrlPattern, // Fallback to default CDN in case of error
  ],
  endpoint: [
    "https://metrics.yourwebsite.com/GET_RESULT_PATH",
    FingerprintJS.defaultEndpoint, // Fallback to default endpoint in case of error
  ],
});
```
#### Importing the JS agent directly from CDN

```js
const url = "https://metrics.yourwebsite.com/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=PUBLIC_API_KEY";
const fpPromise = import(url).then((FingerprintJS) =>
  FingerprintJS.load({
    endpoint: [
      "https://metrics.yourwebsite.com/GET_RESULT_PATH",
      FingerprintJS.defaultEndpoint, // Fallback to default endpoint in case of error
    ],
  }),
);
```

## Feedback and support

Please reach out to our [Customer Success team](https://fingerprint.com/support/) if run into any issues with the integration.

## License

This project is licensed under the [MIT license](./LICENSE).
