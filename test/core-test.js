/*
	Tests for the a2vhsite module

	Tested - functions that are tested fully or partially in this document - found in `describe()`
	Stubs - functions that return simple replies and replaces other function not part of the test - found in `stubs`
	Spies - functions that record how they where being called - found in `spies`
	Fakes - objects that have some working implementations - found in `fakes`
	Dummies - objects are passed around just to fill parameter lists - found in `dummies`
	Real - objects or functions from an original module where a mock would be identical - found in `real`
*/


/*
	Module dependencies
*/
// Get functions without module.exports, inject mocks, inspect/override variables
// - for all modules (compatible with proxyquire)
require("rewire-global").enable();
// Assertion library
const expect = require("chai").expect;
// Spies, stubs, and mocks
const sinon = require("sinon");
// Proxies require to override dependencies
const proxyquire = require("proxyquire");
// Node.js filesystem to check saving, get config, etc
const fs = require("fs");


describe("core", function() {
	/*
		Object definitions
	*/
	const stubs = {};
	const spies = {};
	const fakes = {};
	// const dummies = {};
	const real = {};

	/*
		Hoisting
	*/
	let core;

	before(function() {
		/*
			Proxyquire - stubs, spies, fakes, dummies
		*/
		spies["child_process.spawnSync"] = sinon.spy();
		stubs["child_process"] =  {
			spawnSync() {
				spies["child_process.spawnSync"](...arguments);
			},
			"@noCallThru": true // don't allow the original to be called or required
		};


		/*
			Proxyquire - module to test
		*/
		core = proxyquire("../lib/core.js", {
			"child_process": stubs["child_process"]
		});


		/*
			Fakes
		*/
		fakes.domain = "example.com";
		real.template = "./template.conf";
		const replaceDomain = function(text) {
			return text.replace(/\{domain\}/gi, fakes.domain);
		};
		fakes.config = replaceDomain(fs.readFileSync(real.template).toString());
		fakes.savePath = "./test";
		fakes.saveFile = replaceDomain("./test/{domain}.conf");
		fakes.dirPath = replaceDomain("./test/one/two/three/{domain}");
	});

	describe("Config", function() {
		describe("new Config()", function() {
			context("when using a template", function() {
				it("should make a config", function() {
					expect(
						new core.Config(fakes.domain, {
							"template": real.template
						}).data
					).to.equal(
						fakes.config
					);
				});
			});

			context("when using directives", function() {
				it("should make a config", function() {
					expect(
						new core.Config(fakes.domain, {
							"directives": {
								"ServerAdmin": "admin@{domain}",
								"ServerName": "www.{domain}",
								"ServerAlias": "{domain}",
								"DocumentRoot": "/var/www/{domain}/public_html",
								"LogLevel": "error",
								"ErrorLog": "/var/www/{domain}/log/error.log"
							},
							"address": "*",
							"port": "80"
						}).data
					).to.equal(
						fakes.config
					);
				});
			});

			// Throws
			context("when no template is present", function() {
				it("should throw error", function() {
					expect(() => {
						new core.Config(fakes.domain, {
							"template": "./lib/notactuallyhere.conf"
						});
					}).to.throw();
				});
			});
			context("when object is empty", function() {
				it("should throw error", function() {
					expect(function() {
						new core.Config(fakes.domain, {});
					}).to.throw();
				});
			});
			context("when no domain is present", function() {
				it("should throw error", function() {
					expect(function() {
						new core.Config(null, {
							"template": real.template
						});
					}).to.throw();
				});
			});
		});


		describe("save()", function() {
			it("should save a config", function() {
				new core.Config(fakes.domain, {
					"template": real.template
				}).save(fakes.savePath);

				expect(
					fs.readFileSync(fakes.saveFile).toString()
				).to.equal(
					fakes.config
				);
			});
		});


		describe("enable()", function() {
			it("should run a subprocess to enable domain", function() {
				spies["child_process.spawnSync"].reset();
				new core.Config(fakes.domain, {
					"template": real.template
				}).enable();

				expect(
					spies["child_process.spawnSync"].withArgs("a2ensite", [fakes.domain]).calledOnce
				).to.be.true;
			});
		});
	});


	describe("mkdir()", function() {
		context("when there is no directory", function() {
			it("should make directories up to that path", function() {
				core.mkdir(fakes.dirPath);

				expect(
					fs.statSync(fakes.dirPath).isDirectory()
				).to.be.true;
			});
		});

		// Run again
		context("when there is a directory", function() {
			it("should not throw error", function() {
				expect(() => {
					core.mkdir(fakes.dirPath);
				}).to.not.throw();
			});
		});

		context("when there is a file", function() {
			it("should throw error", function() {
				expect(() => {
					core.mkdir("./package.json");
				}).to.throw();
			});
		});
	});


	describe("reload()", function() {
		it("should run a subprocess to reload apache2", function() {
			spies["child_process.spawnSync"].reset();
			core.reload();

			expect(
				spies["child_process.spawnSync"].withArgs("service", ["apache2", "reload"]).calledOnce
			).to.be.true;
		});
	});
});
