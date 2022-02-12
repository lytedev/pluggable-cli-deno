import {yaml, fs, path} from "./deps.ts"

const MANIFEST_URL = "file:///home/daniel/code/pluggable-cli/manifest.yml"
const PLUGINS_DIR = "/home/daniel/.home/.cache/installed-plugins"

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

async function usage() {
	console.info("cli-poc: a CLI proof-of-concept")
	console.info("  -h, --help: Show usage")
	console.info("  install-plugin <plugin-name>")
	console.info("  update-plugin <plugin-name>")
	console.info("  remove-plugin <plugin-name>")
	console.info("  list-plugins")
}

async function listPlugins() {
	for (const pluginName in manifest.plugins) {
		let text = pluginName
		if (manifest.plugins[pluginName].installed) text += " [installed]"
		console.info(text)
	}
}

async function installedPlugins() {

}

async function installPlugin(pluginName: string) {
	const pluginManifestData = manifest.plugins[pluginName]
	if (!pluginManifestData) {
		console.error(`plugin ${pluginName} has no entry`)
		Deno.exit(1)
	}
	const cmd = ["git", "clone", pluginManifestData.remote, pluginName]
	const installCommand = Deno.run({
		cwd: PLUGINS_DIR,
		stdout: "piped",
		stderr: "piped",
		cmd
	})
	const status = await installCommand.status()
	if (status.code != 0) {
		console.error(`Installing plugin using command ${cmd} failed:\n${await installCommand.output()}\n${await installCommand.stderrOutput()}`)
		Deno.exit(status.code)
	}
	return installCommand
}

async function deletePlugin(pluginName: string) {
	await fs.emptyDir(path.join(PLUGINS_DIR, pluginName))
	await Deno.remove(path.join(PLUGINS_DIR, pluginName))
}

async function updatePlugin(pluginName: string) {
	await deletePlugin(pluginName)
	await installPlugin(pluginName)
}

const subcommand = Deno.args[0]
if (Deno.args.includes("-h") || subcommand == "help" || subcommand == "" || Deno.args.includes("--help")) {
	usage()
} else if (subcommand == "update-plugin") {
	await updatePlugin(Deno.args[1])
} else if (subcommand == "remove-plugin") {
	await deletePlugin(Deno.args[1])
} else if (subcommand == "install-plugin") {
	await installPlugin(Deno.args[1])
} else if (subcommand == "list-plugins") {
	listPlugins()
} else {
	if (manifest.plugins[subcommand].installed !== true) {
		// console.warn(`Installing missing ${subcommand} plugin...`)
		await installPlugin(subcommand)
	}
	const subcommandCommand = Deno.run({
		cmd: [manifest.plugins[subcommand].run.replace("{plugin_dir}", path.join(PLUGINS_DIR, subcommand))].concat(Deno.args.slice(1))
	})
	const status = await subcommandCommand.status()
	if (status.code != 0) Deno.exit(status.code)
}