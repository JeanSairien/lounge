"use strict";

const _ = require("lodash");
const colors = require("colors/safe");
const fs = require("fs");
const fsextra = require("fs-extra");
const Helper = require("../helper");
const path = require("path");

let home;

class Utils {
	static extraHelp() {
		[
			"",
			"",
			"  Environment variable:",
			"",
			`    THELOUNGE_HOME   Path for all configuration files and folders. Defaults to ${colors.green(Helper.expandHome(Utils.defaultHome()))}.`,
			"",
		].forEach((e) => log.raw(e));
	}

	static defaultHome() {
		if (home) {
			return home;
		}

		let distConfig;

		// TODO: Remove this section when releasing The Lounge v3
		const deprecatedDistConfig = path.resolve(path.join(
			__dirname,
			"..",
			"..",
			".lounge_home"
		));
		if (fs.existsSync(deprecatedDistConfig)) {
			log.warn(`${colors.green(".lounge_home")} is ${colors.bold.red("deprecated")} and will be ignored as of The Lounge v3.`);
			log.warn(`Use ${colors.green(".thelounge_home")} instead.`);

			distConfig = deprecatedDistConfig;
		} else {
			distConfig = path.resolve(path.join(
				__dirname,
				"..",
				"..",
				".thelounge_home"
			));
		}

		home = fs.readFileSync(distConfig, "utf-8").trim();

		return home;
	}

	// Parses CLI options such as `-c public=true`, `-c debug.raw=true`, etc.
	static parseConfigOptions(val, memo) {
		// Invalid option that is not of format `key=value`, do nothing
		if (!val.includes("=")) {
			return memo;
		}

		const parseValue = (value) => {
			if (value === "true") {
				return true;
			} else if (value === "false") {
				return false;
			} else if (value === "undefined") {
				return undefined;
			} else if (value === "null") {
				return null;
			} else if (/^\[.*\]$/.test(value)) { // Arrays
				// Supporting arrays `[a,b]` and `[a, b]`
				const array = value.slice(1, -1).split(/,\s*/);
				// If [] is given, it will be parsed as `[ "" ]`, so treat this as empty
				if (array.length === 1 && array[0] === "") {
					return [];
				}
				return array.map(parseValue); // Re-parses all values of the array
			}
			return value;
		};

		// First time the option is parsed, memo is not set
		if (memo === undefined) {
			memo = {};
		}

		// Note: If passed `-c foo="bar=42"` (with single or double quotes), `val`
		//       will always be passed as `foo=bar=42`, never with quotes.
		const position = val.indexOf("="); // Only split on the first = found
		const key = val.slice(0, position);
		const value = val.slice(position + 1);
		const parsedValue = parseValue(value);

		if (_.has(memo, key)) {
			log.warn(`Configuration key ${colors.bold(key)} was already specified, ignoring...`);
		} else {
			memo = _.set(memo, key, parsedValue);
		}

		return memo;
	}

	// If necessary, creates the directory where The Lounge-specific packages will
	// be installed, as well as an informative `package.json` file.
	// Returns the location where this directory is created.
	static preparePackagesDir() {
		const packagesPath = Helper.getPackagesPath();
		const packagesParent = path.dirname(packagesPath);
		const packagesConfig = path.join(packagesParent, "package.json");

		// Create node_modules folder, otherwise npm will start walking upwards to
		// find one
		fsextra.ensureDirSync(packagesPath);

		// Create package.json with private set to true to avoid npm warnings
		fs.writeFileSync(packagesConfig, JSON.stringify({
			private: true,
			description: "Packages for The Lounge. All packages in node_modules directory will be automatically loaded.",
		}, null, "\t"));

		return packagesParent;
	}
}

module.exports = Utils;
