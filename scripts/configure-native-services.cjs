// Public native client IDs only; no secrets are written into the application bundle.
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const env = parseEnv(
  fs.readFileSync(path.join(root, "apps/mobile/.env.local"), "utf8"),
);
const values = {
  google: env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  merchant: env.NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID || "",
};
if (
  values.google &&
  !/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(values.google)
)
  throw new Error("Invalid Google iOS client ID.");
if (values.merchant && !/^merchant\.[a-zA-Z0-9.-]+$/.test(values.merchant))
  throw new Error("Invalid Apple Pay merchant ID.");
const result = spawnSync(
  "python3",
  [
    "-c",
    `
import json,plistlib,pathlib,sys
root=pathlib.Path(sys.argv[1]); values=json.loads(sys.stdin.read())
p=root/'apps/mobile/ios/App/App/Info.plist'
info=plistlib.load(p.open('rb'))
schemes=info.setdefault('CFBundleURLTypes',[])
if values['google']:
 reverse='.'.join(reversed(values['google'].split('.')))
 if not any(reverse in e.get('CFBundleURLSchemes',[]) for e in schemes): schemes.append({'CFBundleURLSchemes':[reverse]})
with p.open('wb') as f: plistlib.dump(info,f,sort_keys=False)
p=root/'apps/mobile/ios/App/App/App.entitlements'
ent=plistlib.load(p.open('rb')) if p.exists() else {}
ent['com.apple.developer.applesignin']=['Default']
if values['merchant']: ent['com.apple.developer.in-app-payments']=[values['merchant']]
with p.open('wb') as f: plistlib.dump(ent,f,sort_keys=False)
p=root/'apps/mobile/ios/App/App.xcodeproj/project.pbxproj'; text=p.read_text()
if 'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;' not in text: text=text.replace('INFOPLIST_FILE = App/Info.plist;', 'INFOPLIST_FILE = App/Info.plist;\\n\\t\\t\\t\\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;')
p.write_text(text)
`,
    root,
  ],
  { input: JSON.stringify(values), encoding: "utf8" },
);
if (result.status !== 0)
  throw new Error(
    "Unable to configure native entitlements. Ensure Python 3 is available.",
  );
console.log(
  "Native return schemes and Apple entitlements prepared. Match these capabilities in the Apple signing profile; run Capacitor sync after building.",
);
console.log(
  "Google iOS:",
  values.google ? "configured" : "requires NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID",
);
console.log(
  "Apple Pay:",
  values.merchant ? "configured" : "requires NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID",
);
