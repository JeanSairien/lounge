"use strict";

const colors = require("colors/safe");
const program = require("commander");
const Helper = require("../helper");
const Utils = require("./utils");

program
	.command("install <package>")
	.description("Install a theme or a package")
	.on("--help", Utils.extraHelp)
	.action(function(packageName) {
		const fs = require("fs");
		const child = require("child_process");
		const packageJson = require("package-json");

		if (!fs.existsSync(Helper.getConfigPath())) {
			log.error(`${Helper.getConfigPath()} does not exist.`);
			return;
		}

		log.info("Retrieving information about the package...");

		packageJson(packageName, {
			fullMetadata: true,
		}).then((json) => {
			if (!("thelounge" in json)) {
				log.error(`${colors.red(packageName)} does not have The Lounge metadata.`);

				process.exit(1);
			}

			const packagesParent = Utils.preparePackagesDir();

			log.info(`Installing ${colors.green(packageName)}...`);

			const npm = child.spawn(
				process.platform === "win32" ? "npm.cmd" : "npm",
				[
					"install",
					"--production",
					"--no-save",
					"--no-bin-links",
					"--no-package-lock",
					"--prefix",
					packagesParent,
					packageName,
				],
				{
					stdio: "inherit",
				}
			);

			npm.on("error", (e) => {
				log.error(`${e}`);
				process.exit(1);
			});

			npm.on("close", (code) => {
				if (code !== 0) {
					log.error(`Failed to install ${colors.green(packageName)}. Exit code: ${code}`);
					return;
				}

				log.info(`${colors.green(packageName)} has been successfully installed.`);
			});
		}).catch((e) => {
			log.error(`${e}`);
			process.exit(1);
		});
	});
