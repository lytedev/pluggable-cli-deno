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
