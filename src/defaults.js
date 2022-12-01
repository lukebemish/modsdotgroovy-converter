export const defaultQuiltModJson = `{
	"schema_version": 1,
	"quilt_loader": {
		"group": "com.example",
		"id": "example_mod",
		"version": "\${version}",
		"metadata": {
			"name": "Mod Name",
			"description": "A short description of your mod.",
			"contributors": {
				"Your name here": "Owner"
			},
			"contact": {
				"homepage": "https://example.com/",
				"issues": "https://github.com/QuiltMC/quilt-template-mod/issues",
				"sources": "https://github.com/QuiltMC/quilt-template-mod"
			},
			"icon": "assets/example_mod/icon.png"
		},
		"intermediate_mappings": "net.fabricmc:intermediary",
		"entrypoints": {
			"init": "com.example.example_mod.ExampleMod"
		},
		"depends": [
			{
				"id": "quilt_loader",
				"versions": ">=0.17.0-"
			},
			{
				"id": "quilted_fabric_api",
				"versions": ">=4.0.0-"
			},
			{
				"id": "minecraft",
				"versions": ">=1.19.2"
			}
		]
	},
	"mixin": "example_mod.mixins.json"
}
`

export const defaultModsToml = `modLoader="javafml"
loaderVersion="[43,)"
license="All rights reserved"
issueTrackerURL="https://change.me.to.your.issue.tracker.example.invalid/"

[[mods]]
modId="examplemod"
version="\${file.jarVersion}"
displayName="Example Mod"
updateJSONURL="https://change.me.example.invalid/updates.json"
displayURL="https://change.me.to.your.mods.homepage.example.invalid/"
logoFile="examplemod.png"
credits="Thanks for this example mod goes to Java"
authors="Love, Cheese and small house plants"
displayTest="MATCH_VERSION"

description='''
This is a long form description of the mod. You can write whatever you want here

Have some lorem ipsum.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed mollis lacinia magna. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed sagittis luctus odio eu tempus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque volutpat ligula eget lacus auctor sagittis. In hac habitasse platea dictumst. Nunc gravida elit vitae sem vehicula efficitur. Donec mattis ipsum et arcu lobortis, eleifend sagittis sem rutrum. Cras pharetra quam eget posuere fermentum. Sed id tincidunt justo. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
'''

[[dependencies.examplemod]]
    modId="forge"
    mandatory=true
    versionRange="[43,)"
    ordering="NONE"
    side="BOTH"

[[dependencies.examplemod]]
    modId="minecraft"
    mandatory=true
    versionRange="[1.19.2,1.20)"
    ordering="NONE"
    side="BOTH"
`