import { reporter } from "./reporter"
import path from "path"
import { PluginConfigMap } from "."
import { requireResolve } from "./require-utils"

class GatsbyNotFound extends Error {
  constructor(rootPath: string) {
    super(
      `Could not find "gatsby" in ${rootPath}. Perhaps it wasn't installed properly?`
    )
  }
}

class GatsbyCliNotFound extends Error {
  constructor() {
    super(`gatsby-cli not installed, or is too old`)
  }
}

class AddPluginsError extends Error {
  constructor(message: string) {
    super(
      `Something went wrong when trying to add the plugins to the project: ${message}`
    )
  }
}

const resolveGatsbyPath = (rootPath: string): string | never => {
  try {
    const gatsbyPath = requireResolve(`gatsby/package.json`, {
      paths: [rootPath],
    })

    if (!gatsbyPath) throw new Error()

    return gatsbyPath
  } catch (e) {
    throw new GatsbyNotFound(rootPath)
  }
}

const resolveGatsbyCliPath = (
  rootPath: string,
  gatsbyPath: string
): string | never => {
  try {
    const installPluginCommand = requireResolve(`gatsby-cli/lib/plugin-add`, {
      // Try to find gatsby-cli in the site root, or in the site's gatsby dir
      paths: [rootPath, path.dirname(gatsbyPath)],
    })

    if (!installPluginCommand) throw new Error()

    return installPluginCommand
  } catch (e) {
    throw new GatsbyCliNotFound()
  }
}

const addPluginsToProject = async (
  installPluginCommand: string,
  plugins: Array<string>,
  pluginOptions: PluginConfigMap = {},
  rootPath: string,
  packages: Array<string>
): Promise<void> => {
  try {
    const { addPlugins } = require(installPluginCommand)
    await addPlugins(plugins, pluginOptions, rootPath, packages)
  } catch (e) {
    throw new AddPluginsError(e.message)
  }
}

export async function installPlugins(
  plugins: Array<string>,
  pluginOptions: PluginConfigMap = {},
  rootPath: string,
  packages: Array<string>
): Promise<void> {
  let installPluginCommand
  let gatsbyPath

  try {
    gatsbyPath = resolveGatsbyPath(rootPath)
    installPluginCommand = resolveGatsbyCliPath(rootPath, gatsbyPath)

    await addPluginsToProject(
      installPluginCommand,
      plugins,
      pluginOptions,
      rootPath,
      packages
    )
  } catch (e) {
    reporter.error(e.message)
    return
  }
}
