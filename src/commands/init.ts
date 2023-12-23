import { existsSync, promises as fs } from "fs"
import path from "path"
import type { InitOptType, SupportedLanguages } from "@/src/types"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"
import prompts, { type Choice } from "prompts"
import { rimraf } from "rimraf"

const languages: Choice[] = [
  {
    title: " Python",
    value: "python",
  },
  {
    title: "󰛦 Typescript",
    value: "typescript",
  },
  {
    title: " Golang",
    value: "golang",
    disabled: true,
  },
]

export const init = new Command()
  .name("init")
  .description("Initialize your project and add config files")
  .option("-l, --language <lang>", "Language to use", "python")
  .action(async (opts: InitOptType) => {
    const lang = opts.language
    const cwd = process.cwd()

    // Ensure target directory exists.
    if (!existsSync(cwd)) {
      process.exit(1)
    }

    await promptConfig(cwd, lang as SupportedLanguages)
  })

export async function promptConfig(cwd: string, lang: SupportedLanguages) {
  const highlight = (text: string) => chalk.cyan(text)

  const options = await prompts([
    {
      type: "select",
      name: "lang",
      message: `What ${highlight("language")} are you using?`,
      choices: languages.map((language) => ({ ...language })),
      initial: languages.findIndex((language) => language.value === lang),
    },
  ])

  const { proceed } = await prompts({
    type: "confirm",
    name: "proceed",
    message: `Write configuration to ${highlight(cwd)}. Proceed?`,
    initial: true,
  })

  if (!proceed) {
    process.exit(0)
  }

  const spinner = ora(`Vscode config setup...`).start()
  initVscode(cwd, lang)
  spinner.succeed()

  return 0
}

async function initVscode(cwd: string, lang: SupportedLanguages) {
  const vsCodePath = path.resolve(cwd, ".vscode")
  if (existsSync(vsCodePath)) {
    rimraf.sync(vsCodePath)
  }
  await fs.mkdir(vsCodePath, { recursive: true })
  await fs.writeFile(
    vsCodePath + "/settings.json",
    JSON.stringify(vscodeConfigs[lang], null, 2)
  )
}

const vscodeConfigs: Record<SupportedLanguages, Record<string, any>> = {
  python: {
    "python.analysis.typeCheckingMode": "strict",
    "python.analysis.autoImportCompletions": true,
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.codeActionsOnSave": {
      "source.organizeImports": true,
      "source.fixAll": true,
    },
    "[jsonc]": {
      "editor.defaultFormatter": "vscode.json-language-features",
    },
  },
  typescript: {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true,
      "source.fixAll.eslint": true,
      "source.fixAll": true,
    },
  },
  golang: {},
}
