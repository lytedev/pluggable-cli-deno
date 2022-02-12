# CLI Proof-of-Concept

None of this crap is really tested. Have fun!

[🖥️ Upstream][upstream] • [🐙 GitHub Mirror][github]

## Installation

Run the below scripts to install `poc-cli` for your platform:

### Linux x86_64

```sh
sudo curl -o /usr/bin/poc-cli \
	https://files.lyte.dev/poc-cli/poc-cli.linux.x86_64
sudo chmod 755 /usr/bin/poc-cli
```

### macOS Intel

```sh
sudo curl -o /usr/bin/poc-cli \
	https://files.lyte.dev/poc-cli/poc-cli.darwin.x86_64
sudo chmod 755 /usr/bin/poc-cli
```

### macOS Apple Silicon (M1)

```sh
sudo curl -o /usr/bin/poc-cli \
	https://files.lyte.dev/poc-cli/poc-cli.darwin.aarch64
sudo chmod 755 /usr/bin/poc-cli
```

### Just let me download files through my browser like a normal human being

Ok, fine geez.

- **File Archive**: https://files.lyte.dev/poc-cli/

### Why are these binaries so freakin' big?

It's got the whole Deno runtime packed in there.

Also, something something your mom. <3

## Known Issues

- The plugin directory being present doesn't _really_ mean it's "installed" ;P

## Compile It Yourself

```sh
deno compile -A -o poc-cli src/core.ts
```

You can cross-compile, too. See `deno compile --help` for `--target`.

```
deno compile -A -o poc-cli.linux.x86_64 --target x86_64-unknown-linux-gnu src/core.ts
deno compile -A -o poc-cli.darwin.x86_64 --target x86_64-apple-darwin src/core.ts
deno compile -A -o poc-cli.darwin.aarch64 --target aarch64-apple-darwin src/core.ts
```

### Install

I dunno, but probably something like this:

```sh
sudo mv poc-cli /usr/bin/poc-cli
sudo chown root:root /usr/bin/poc-cli
sudo chmod 755 /usr/bin/poc-cli
```

## Usage

It's self-documenting... sort of!

```
poc-cli
```

-----

# My Old Notes Below!

-----

# Pluggable CLI

- Each subcommand is a plugin?
- Versioning and/or stability will be important?
	- Maybe plugins _never_ change and instead you prefix them with a version?
		- How can we build stability into the system?
- Some subset or all plugins are already known
- Auto-download plugins when attempting to run a command
- Completions for subcommands
	- Are completions provided for commands not-yet-installed? Does attempting to
		complete a subcommand's commands install the plugin and process its
		completions?
- Will have configuration

# Core functions

- What plugins are available to me?
	- HTTP GET (and cache?) some known human- and machine-readable manifest
		- JSON, YAML, Cue, or Ion?
- Install a plugin
	- HTTP GET
- Delete a plugin
	- rm -r dir
- Update self
	- download new binary and replace self with it
- Update plugin
	- replace plugin
- Run a plugin with some given arguments
	- call plugin with args

# Components I See

- Core
	- Knows where to find manifest (may cache locally)
	- Installs, updates, deletes plugins using information in manifest
	- Can update or uninstall itself
	- Can run plugins
- Manifest
	- Contains information about where to find plugins and their versions
- Plugins
	- Probably dumb scripts that call fancier things

[upstream]: https://git.lyte.dev/lytedev/pluggable-cli-deno
[github]: https://github.com/lytedev/pluggable-cli-deno
