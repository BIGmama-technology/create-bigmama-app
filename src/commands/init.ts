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
  await initVscode(cwd, options.lang)
  if (lang === "typescript") {
    await initPrettier(cwd)
  } else if (lang === "python") {
    await initGitlint(cwd)
  }
  spinner.succeed()
}

async function initPrettier(cwd: string) {
  const configPath = cwd + "/.prettierrc"
  const ignorePath = cwd + "/.prettierignore"
  if (!existsSync(configPath)) {
    await fs.writeFile(
      configPath,
      JSON.stringify(prettierConfig.config, null, 2)
    )
  }
  if (!existsSync(ignorePath)) {
    await fs.writeFile(ignorePath, prettierConfig.ignore)
  }
}

async function initGitlint(cwd: string) {
  const gitlintPath = cwd + "/.gitlint"
  if (!existsSync(gitlintPath)) {
    await fs.writeFile(gitlintPath, gitlintConfig)
  }
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

const prettierConfig = {
  config: {
    jsxSingleQuote: true,
    singleQuote: true,
    semi: false,
    tabWidth: 2,
    trailingComma: "all",
    printWidth: 100,
    bracketSameLine: false,
    useTabs: false,
    arrowParens: "always",
    endOfLine: "auto",
  },
  ignore: ".yarn\n.next\ndist\nnode_modules",
}

const gitlintConfig = `
[general]
ignore=B6
contrib=contrib-title-conventional-commits
regex-style-search=true
# This is an example of how to configure the "title-max-length" rule and
# set the line-length it enforces to 50
[title-max-length]
line-length=100

# Conversely, you can also enforce minimal length of a title with the
# "title-min-length" rule:
[title-min-length]
min-length=5

[author-valid-email]
# python-style regex that the commit author email address must match.
# For example, use the following regex if you only want to allow email addresses from foo.com
regex=[^@]+@big-mama.io

[ignore-by-title]
# Ignore certain rules for commits of which the title matches a regex
# E.g. Match commit titles that start with "Release"
regex=^Release(.*)

# This is a contrib rule - a community contributed rule. These are disabled by default.
# You need to explicitly enable them one-by-one by adding them to the "contrib" option
# under [general] section above.
[contrib-title-conventional-commits]
# Specify allowed commit types. For details see: https://www.conventionalcommits.org/
types = fix,feat,chore,docs,style,refactor,perf,test,revert,ci,build
`
