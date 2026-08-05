import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFile(path.join(root, relative), "utf8");

const [template, cssSource, scheduler, app] = await Promise.all([
  read("src/template.html"),
  read("src/app.css"),
  read("src/scheduler-core.js"),
  read("src/app.js")
]);

let optionalFontFace = "";
try {
  const font = await fs.readFile(path.join(root, "assets/fonts/ChildFunSans-CHS.ttf"));
  optionalFontFace = `@font-face {
  font-family: "Child Fun Sans";
  src: url("data:font/ttf;base64,${font.toString("base64")}") format("truetype");
  font-display: swap;
}`;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const characters = [];
for (let index = 1; index <= 15; index += 1) {
  const filename = `character-${String(index).padStart(2, "0")}.png`;
  const data = await fs.readFile(path.join(root, "assets/characters", filename));
  characters.push(`data:image/png;base64,${data.toString("base64")}`);
}

const css = cssSource.replace("/*__OPTIONAL_FONT_FACE__*/", optionalFontFace);
const assets = `window.LANTERN_DEFAULT_CHARACTERS = ${JSON.stringify(characters)};`;
const html = template
  .replace("/*__INLINE_CSS__*/", css)
  .replace("/*__DEFAULT_ASSETS__*/", assets)
  .replace("/*__SCHEDULER_CORE__*/", scheduler)
  .replace("/*__APP_JS__*/", app);

await fs.mkdir(path.join(root, "dist"), { recursive: true });
await fs.writeFile(path.join(root, "dist/lantern-reminder.html"), html);
console.log(`Built dist/lantern-reminder.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
