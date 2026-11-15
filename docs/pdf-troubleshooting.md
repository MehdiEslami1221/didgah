# PDF rendering

Didgah renders an HTML report in headless Chromium. The report includes its Persian font directly, so it does not depend on a font CDN. PDF generation uses the Node.js runtime and needs an executable browser plus its Linux dependencies.

## Standard installation

```bash
cd /opt/urban-survey
node node_modules/playwright/cli.js install-deps chromium
sudo -u survey -H npm run pdf:install
sudo -u survey -H npm run test:pdf
```

The smoke test should print `PDF created` for `summary`, `individual` and `all`. It uses synthetic responses and does not modify the database.

## Download refused with HTTP 403

A message such as `This service is not available in your location` means the browser provider rejected the download. Reinstalling system libraries will not resolve it.

If you can download the exact Linux browser archive from an authorized machine where the provider makes it available, transfer that archive to the server. Use the URL and version printed by the installed Playwright CLI, or inspect its download plan:

```bash
node node_modules/playwright/cli.js install --dry-run chromium
```

Download the **Linux archive for the server architecture**, even when the transfer machine runs Windows. Do not copy a Windows Chrome executable onto Linux. Use the official distribution source, not an unrelated third-party binary.

Example for an x86_64 Linux `chrome-linux64.zip` archive already downloaded to Windows:

```powershell
cd "$env:USERPROFILE\Downloads"
scp .\chrome-linux64.zip root@YOUR_SERVER:/root/
ssh root@YOUR_SERVER
```

The remaining commands run **inside the Linux SSH session**, not in PowerShell:

```bash
mkdir -p /opt/didgah-browser
unzip /root/chrome-linux64.zip -d /opt/didgah-browser
chmod -R a+rX /opt/didgah-browser
chmod a+x /opt/didgah-browser/chrome-linux64/chrome
sudo -u survey -H /opt/didgah-browser/chrome-linux64/chrome --version
cd /opt/urban-survey
sudo -u survey -H env CHROMIUM_PATH=/opt/didgah-browser/chrome-linux64/chrome npm run test:pdf
```

After a successful test, add this setting to `.env.local`:

```dotenv
CHROMIUM_PATH=/opt/didgah-browser/chrome-linux64/chrome
```

Then restart:

```bash
systemctl restart urban-survey
```

Passing `CHROMIUM_PATH` on the test command only affects that process. It does not configure the website. The environment-file setting and service restart are both required.

## Test passes but website fails

Confirm that `.env.local` has one active `CHROMIUM_PATH` line, without a leading `#`, and that the service user can execute the browser. Restart the service and attempt one download, then inspect only recent logs:

```bash
journalctl -u urban-survey --since "5 minutes ago" --no-pager
```

The supplied service uses `PrivateTmp` and `NoNewPrivileges`. If execution fails under systemd, diagnose the specific log message before changing service protections. A successful shell test and a missing-executable error in the service usually indicate different paths or stale environment settings.

## Large combined reports

Combined reports include the aggregate statistics and all 56 answers for every participant. A survey with 50 participants can produce hundreds of pages. Only one PDF is rendered at a time per application process. If a proxy times out, individual downloads or the browser-print report are useful alternatives while investigating the timeout.

The browser print view is available independently of server-side Chromium. It uses the administrator's browser to print or save a PDF.
