#!/usr/bin/env node
import { Command } from "commander"

import { init } from "./commands/init"

function main() {
  const program = new Command()
    .name("bigmama-starter")
    .description("Bootstrap new projects with ease")
    .version("0.0.0")

  program.addCommand(init)

  program.parse()
}

main()
