/*
	Module dependencies
*/
// Vorpal - CLI package, for the inquiry.js separator
const vorpal = require("vorpal")();


/*
	Create Command Arguments - Some basic directives and other arguments.

	createArguments: {
		"constructorArguments": {
			"directives": {} // arguments for directives
		} // arguments only for constructing from flags or interactive mode
	} // all arguments for the create command

	flag: the flag string used for vorpal.command.option
	description: the string used for vorpal.command.option's description and for interactive prompts
	default: initial value for the flag if the value is missing and to make it easier on the user. If choices is present, it's an index as per prompt spec.
	autocomplete: helpful popular options that aren't forced like choices are
	choices: array of options for prompts, also used default values

	"true" and "false" are used in choices and default to prevent `undefined` bugs with Inquirer.js :(
	new vorpal.ui.inquirer.Separator() makes a separator for Inquirer.js as well. The default index isn't affected by it (impossible to select so adding it at the beginning of the array wouldn't result in a change of default)
*/
const data = {
	"template": {
		"flag": "-t, --template [path]",
		"description": "template mode, path to config template",
		"default": "./template.conf"
	},
	"output": {
		"flag": "-o, --output [path]",
		"description": "path to output the config files",
		"default": "/etc/apache2/sites-available/"
	},
	"make-directories": {
		"flag": "-m, --make-directories",
		"description": "create folders for the logs or DocumentRoot",
		"choices": ["true", "false"],
		"default": 1
	},
	"enable": {
		"flag": "-e, --enable",
		"description": "enable sites using a2ensite",
		"choices": ["true", "false"],
		"default": 1
	},
	"reload": {
		"flag": "-r, --reload",
		"description": "reload apache2 using service apache2 reload",
		"choices": ["true", "false"],
		"default": 1
	},
	"constructorArguments": {
		"address": {
			"flag": "-A, --address [address]",
			"description": "VirtualHost addresses to serve, can be multiple",
			"default": "*"
		},
		"port": {
			"flag": "-P, --port [port]",
			"description": "VirtualHost ports to serve, can be multiple",
			"autocomplete": ["80", "443"],
			"default": "80"
		},
		"directives": {
			"directory-index": {
				"flag": "-I, --directory-index [value]",
				"directive": "DirectoryIndex",
				"description": "DirectoryIndex directive",
				"default": "false"
			},
			"document-root": {
				"flag": "-O, --document-root [path]",
				"directive": "DocumentRoot",
				"description": "DocumentRoot directive",
				"default": "/var/www/{domain}/public_html"
			},
			"redirect": {
				"flag": "-R, --redirect [value]",
				"directive": "Redirect",
				"description": "Redirect directive",
				"default": "false"
			},
			"server-admin": {
				"flag": "-E, --server-admin, --email [email]",
				"directive": "ServerAdmin",
				"description": "ServerAdmin directive",
				"default": "admin@{domain}"
			},
			"server-alias": {
				"flag": "-A, --server-alias, --alias [name]",
				"directive": "ServerAlias",
				"description": "ServerAlias directive",
				"default": "{domain}"
			},
			"server-name": {
				"flag": "-N, --server-name, --name [name]",
				"directive": "ServerName",
				"description": "ServerName directive",
				"default": "www.{domain}"
			},
			"log-level": {
				"flag": "--log-level [value]",
				"directive": "LogLevel",
				"description": "LogLevel directive",
				"autocomplete": ["emerg", "alert", "crit", "error", "warn", "notice", "info", "debug"],
				"choices": ["emerg", "alert", "crit", "error", "warn", "notice", "info", "debug", new vorpal.ui.inquirer.Separator(), "trace1", "trace2", "trace3", "trace4", "trace5", "trace6", "trace7", "trace8", new vorpal.ui.inquirer.Separator()],
				"default": 3
			},
			"error-log": {
				"flag": "--error-log [path]",
				"directive": "ErrorLog",
				"description": "ErrorLog directive",
				"default": "/var/www/{domain}/log/error.log"
			},
			"transfer-log": {
				"flag": "--transfer-log [path]",
				"directive": "TransferLog",
				"description": "TransferLog directive",
				"default": "false"
			},
			"ssl-engine": {
				"flag": "--ssl-engine [value]",
				"directive": "SSLEngine",
				"description": "SSLEngine directive",
				"autocomplete": ["on", "off", "optional"],
				"choices": ["on", "off", "optional", new vorpal.ui.inquirer.Separator(), "false"],
				"default": 3
			},
			"ssl-certificate": {
				"flag": "--ssl-certificate [path]",
				"directive": "SSLCertificateFile",
				"description": "SSLCertificateFile directive",
				"default": "false"
			},
			"ssl-certificate-key": {
				"flag": "--ssl-certificate-key [path]",
				"directive": "SSLCertificateKeyFile",
				"description": "SSLCertificateKeyFile directive",
				"default": "false"
			},
			"ssl-certificate-chain": {
				"flag": "--ssl-certificate-chain [path]",
				"directive": "SSLCertificateChainFile",
				"description": "SSLCertificateChainFile directive",
				"default": "false"
			}
		}
	},
};


module.exports = data;
