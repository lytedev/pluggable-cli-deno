import {yaml, fs, path, xdg} from "./deps.ts"

// TODO: can we bake VERSION to be the commit hash?
const VERSION = "0.3.0"
const MANIFEST_URL = "https://git.lyte.dev/lytedev/pluggable-cli-deno/raw/branch/master/manifest.yml"
const PLUGINS_DIR = path.join(xdg.cache(), "/poc-cli-installed-plugins")

fs.ensureDir(PLUGINS_DIR)

const verboseOutput = true

const responseBody = await (await fetch(MANIFEST_URL)).text()
const manifest: any = yaml.parse(responseBody)

for await (const dir of Deno.readDir(PLUGINS_DIR)) {
	if (dir.isDirectory) {
		if (manifest.plugins[dir.name]) {
			manifest.plugins[dir.name].installed = true
		}
	}
}
// console.debug(manifest)

async function showConfig() {
	console.info("MANIFEST_URL:", MANIFEST_URL)
	console.info("PLUGINS_DIR:", PLUGINS_DIR)
}

async function usage() {
	console.info(`poc-cli: a CLI proof-of-concept (version ${VERSION})`)
	console.info("  -h, --help: Show usage")
	console.info("  install-plugin <plugin-name>")
	console.info("  update-plugin <plugin-name>")
	console.info("  remove-plugin <plugin-name>")
	console.info("  ensure-plugin <plugin-name>")
	console.info("  list-plugins")
	console.info("  show-config")
	console.info("  <plugin> [args] (Example: poc-cli echo Parrot)")
	console.info("    if the specified plugin isn't installed,")
	console.info("    poc-cli will install it for you")
}

async function listPlugins() {
	for (const pluginName in manifest.plugins) {
		let text = pluginName
		if (manifest.plugins[pluginName].installed) text += " [installed]"
		console.info(text)
	}
}

async function runCommandAndMaybeExit(cmd: string[] | string, additionalOptions?: Partial<Deno.RunOptions>) {
	if (typeof cmd === 'string') {
		cmd = [cmd]
	}
	const opts = Object.assign({
		stdout: "piped",
		stderr: "piped",
		cmd
	}, additionalOptions)
	// console.debug(opts)
	const runner = Deno.run(opts)
	const status = await runner.status()
	if (status.code != 0) {
		console.error(`Command ${JSON.stringify(cmd)} failed:\n${new TextDecoder().decode(await runner.output())}\n${new TextDecoder().decode(await runner.stderrOutput())}`)
		Deno.exit(status.code)
	}
	return runner
}

async function installPlugin(pluginName: string) {
	const pluginManifestData = manifest.plugins[pluginName]
	if (!pluginManifestData) {
		console.error(`plugin ${pluginName} has no entry`)
		Deno.exit(1)
	}

	if (pluginManifestData.preInstallCommand) {
		await runCommandAndMaybeExit(pluginManifestData.preInstallCommand)
	}

	const cmd = (pluginManifestData.installCommand || ["git", "clone", "{remote}", "{plugin_dir}"]).map((segment: string) =>
		segment
			.replace('{remote}', pluginManifestData.remote)
			.replace('{plugin_dir}', path.join(PLUGINS_DIR, pluginName))
	)

	fs.ensureDir(path.join(PLUGINS_DIR, pluginName))
	const result = await runCommandAndMaybeExit(cmd)

	if (pluginManifestData.postInstallCommand) {
		await runCommandAndMaybeExit(pluginManifestData.postInstallCommand)
	}

	return result
}

async function deletePlugin(pluginName: string) {
	await fs.emptyDir(path.join(PLUGINS_DIR, pluginName))
	await Deno.remove(path.join(PLUGINS_DIR, pluginName))
}

async function updatePlugin(pluginName: string) {
	await deletePlugin(pluginName)
	await installPlugin(pluginName)
}

async function ensurePlugin(pluginName: string) {
	if (!manifest.plugins[subcommand].installed) {
		// console.warn(`Installing missing ${subcommand} plugin...`)
		await installPlugin(subcommand)
	}
}

const subcommand = Deno.args[0]
if (Deno.args.includes("-h") || subcommand == "help" || subcommand == "" || Deno.args.includes("--help") || Deno.args.length < 1) {
	usage()
} else if (subcommand == "update-plugin") {
	await updatePlugin(Deno.args[1])
} else if (subcommand == "ensure-plugin") {
	ensurePlugin(subcommand)
} else if (subcommand == "remove-plugin") {
	await deletePlugin(Deno.args[1])
} else if (subcommand == "install-plugin") {
	await installPlugin(Deno.args[1])
} else if (subcommand == "list-plugins") {
	listPlugins()
} else if (subcommand == "show-config") {
	showConfig()
} else {
	await ensurePlugin(subcommand)
	const cmd = (typeof manifest.plugins[subcommand].run === 'string' ?
		[manifest.plugins[subcommand].run] : manifest.plugins[subcommand].run).map((segment: string) => segment.replace("{plugin_dir}", path.join(PLUGINS_DIR, subcommand)))
	await runCommandAndMaybeExit(cmd.concat(Deno.args.slice(1)), {stdout: "inherit", stderr: "inherit"})
}
