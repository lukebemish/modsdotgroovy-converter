import { Button, Panel } from 'react-bulma-components';
import React from 'react';
import { parse as parseTOML } from 'toml';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { defaultQuiltModJson, defaultModsToml } from './defaults.js'

library.add(faGithub)

const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('groovy', require('highlight.js/lib/languages/groovy'));

const isValidGroovyName = name => name.match(/^[a-zA-Z_][a-zA-Z0-9_$]*$/)

function assembleMapFromObject(obj, prefix) {
  let out = '[\n'
  for (const [key, value] of Object.entries(obj)) {
    let keyVal = prefix+'    '+key+': '
    if (!key.match(/^[a-zA-Z_][a-zA-Z0-9_$]*$/)) {
      keyVal = prefix+'    '+groovyStringify(key)+': '
    }
    if (Array.isArray(value)) {
      out += keyVal +assembleListFromArray(value, '    '+prefix)+",\n"
    } else if (typeof value === 'object') {
      out += keyVal +assembleMapFromObject(value, '    '+prefix)+",\n"
    } else if (typeof value === 'string') {
      out += keyVal+groovyStringify(value)+',\n'
    }else {
      out += keyVal + value + ',\n'
    }
  }
  return out.substring(0,out.length-1) + '\n'+prefix+']'
}

function assembleListFromArray(arr, prefix) {
  let out = '[\n'
  for (const value of arr) {
    if (Array.isArray(value)) {
      out += prefix+'    '+assembleListFromArray(value, '    '+prefix)+",\n"
    } else if (typeof value === 'object') {
      out += prefix+'    '+assembleMapFromObject(value, '    '+prefix)+",\n"
    } else if (typeof value === 'string') {
      out += prefix+'    '+groovyStringify(value)+',\n'
    }else {
      out += prefix+'    '+value + ',\n'
    }
  }
  return out.substring(0,out.length-1) + '\n'+prefix+']'
}

function assembleFromSingleValue(value, prefix) {
  if (Array.isArray(value)) {
    return assembleListFromArray(value, '    '+prefix)
  } else if (typeof value === 'object') {
    return assembleMapFromObject(value, '    '+prefix)
  } else if (typeof value === 'string') {
    return groovyStringify(value)
  }else {
    return value
  }
}

function flattenContributors(contributors) {
  let out = {}
  for (const [name, titles] of Object.entries(contributors)) {
    for (const title of titles.split(/, and |, | and /)) {
      if (!title) {
        continue
      }
      if (!out[title]) {
        out[title] = []
      }
      out[title].push(name)
    }
  }
  return out
}

function groovyStringify(value) {
  if (value === undefined) {
    return "'undefined'"
  }
  if (value.includes("${")) {
    return '"'+value+'"'
  }
  return '\''+value+'\''
}

function translateEntrypoint(value, prefix) {
  if (typeof value === 'string') {
    return '"'+value+'"'
  } else if (Array.isArray(value)) {
    return '[\n'+value.map(v => translateEntrypoint(v, prefix+'    ')).join(', \n')+'\n'+prefix+']'
  } else if (typeof value === 'object' && value.adapter) {
    return `adapted {
${prefix}    value = ${translateEntrypoint(value.value, prefix+'    ')}
${prefix}    adapter = ${groovyStringify(value.adapter)}
${prefix}}`
  } else if (typeof value === 'object') {
    return translateEntrypoint(value.value, prefix)
  }
}

function assembleDependencyQuilt(dependency, prefix) {
  let modId = dependency.id;
  let versions = dependency.versions;
  //let reason = dependency.reason;
  //let unless = dependnecy.unless;
  let optional = dependency.optional;
  let mandatory = !optional;
  if (modId === "minecraft") {
    return `minecraft {
    ${prefix}version = this.minecraftVersionRange${optional !== null && optional ? `
    ${prefix}mandatory = ${mandatory}` : ''}
${prefix}}`
  } else if (modId === "quilt_loader") {
    return `quiltLoader {
      ${prefix}version = ">=\${this.quiltLoaderVersion}"${optional !== null && optional ? `
      ${prefix}mandatory = ${mandatory}` : ''}
${prefix}}`
  }
  return `mod("${modId}") {
    ${prefix}version = ${groovyStringify(versions ? versions : "")}${optional !== null && optional ? `
    ${prefix}mandatory = ${mandatory}` : ''}
${prefix}}`
}

class InputHighlighted extends React.Component {
  constructor(props) {
    super(props);
    this.initialValue = props.initialValue;
    this.state = {rawValue: this.initialValue};
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.setState({rawValue: e.target.value});
  }

  render() {
    return (
        <pre className="highlight contents-switchable">
          <code>
            <div className='highlight-editable'>
              <textarea value={this.state.rawValue} onInput={this.handleChange} style={{flex: '1 1 auto'}} data-lang={this.props.lang}/>
            </div>
          </code>
        </pre>
    );
  }
}

class Tabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: this.props.children[0].props.label,
    };
    this.onClickTabItem = this.onClickTabItem.bind(this);
  }

  onClickTabItem(lang,tab) {
    this.setState({ activeTab: tab });
    this.props.langSetter(lang);
  }

  render() {
    return (
      <div className='flex-inner'>
        <Panel.Tabs>
          {this.props.children.map((child) => {
            const { label, lang } = child.props;
            return (
              <Tab
                activeTab={this.state.activeTab}
                key={label}
                label={label}
                onClick={(tab) => this.onClickTabItem(lang, tab)}
              />
            );
          })}
        </Panel.Tabs>
        {this.props.children.map((child) => {
          if (child.props.label !== this.state.activeTab) return undefined;
          return child.props.children;
        })}
      </div>
    );
  }
}

class Tab extends React.Component {
  onClick() {
    const { label, onClick } = this.props;
    onClick(label);
  }

  render() {
    return (
      <Panel.Tabs.Tab active={this.props.activeTab === this.props.label} onClick={() => this.onClick()}>{this.props.label}</Panel.Tabs.Tab>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.convert = this.convert.bind(this);
    this.state = {lang: 'toml'};
    this.setLang = this.setLang.bind(this);
  }

  setLang(lang) {
    this.setState({lang: lang});
  }

  convert() {
    let input = document.querySelector('.contents-switchable textarea').value;
    const lang = this.state.lang;
    const output = document.querySelector('#output');
    if (lang === 'toml') {
      // eslint-disable-next-line no-template-curly-in-string
      input = input.replace(/\${file\.jarVersion}/, "${this.version}")
      // eslint-disable-next-line no-template-curly-in-string
      input = input.replace(/\${file.([a-zA-Z0-9_$]*)}/, "${$1}")
      let parsed = {};
      try {
        parsed = parseTOML(input);
      } catch (e) {
        console.log(e);
        output.innerText = "Could not parse TOML.";
        return;
      }
      let outString = `${parsed.properties ? Object.entries(parsed.properties).map(([key, value]) => {
          return `def ${key} = ${assembleFromSingleValue(value,'')}\n`
        }) : ''}ModsDotGroovy.make {
    modLoader = ${groovyStringify(parsed.modLoader)}
    loaderVersion = ${groovyStringify(parsed.loaderVersion)}
    license = ${groovyStringify(parsed.license)}${parsed.issueTrackerUrl ? `
    issueTrackerUrl = ${groovyStringify(parsed.issueTrackerUrl)}` : ''}${parsed.showAsResourcePack ? `
    showAsResourcePack = ${parsed.showAsResourcePack}` : ''}${
      parsed.mods ? "\n    "+parsed.mods.map(element => {
        return `mod {
        modId = ${groovyStringify(element.modId)}
        version = ${groovyStringify(element.version ? element.version : '1')}${element.displayName ? `
        displayName = ${groovyStringify(element.displayName)}` : ''}${element.description ? `
        description = ${element.description.includes("${") ? '"""' : "'''"}${element.description}${element.description.includes("${") ? '"""' : "'''"}` : ''}${element.logoFile ? `
        logoFile = ${groovyStringify(element.logoFile)}` : ''}${element.logoBlur ? `
        logoBlur = ${element.logoBlur}` : ''}${element.credits ? `
        credits = ${groovyStringify(element.credits)}` : ''}${element.authors ? `
        authors = [${element.authors.split(/, and |, | and /).filter(author => author).map(author => author.trim()).filter(n => n).map(author => `${groovyStringify(author)}`).join(', ')}]` : ''}${element.displayURL ? `
        displayUrl = ${groovyStringify(element.displayURL)}` : ''}${element.updateJSONURL ? `
        updateJsonUrl = ${groovyStringify(element.updateJSONURL)}` : ''}${element.displayTest ? `
        displayTest = ${groovyStringify(element.displayTest)}` : ''}${element.modproperties ? `
        properties = ${assembleMapFromObject(element.modproperties, '        ')}` : ''}${parsed.dependencies && parsed.dependencies[element.modId] ? `
        dependencies {
            ${parsed.dependencies[element.modId].map(dependency => {
              let modId = dependency.modId;
              let ordering = ""
              switch (dependency.ordering) {
                case "NONE":
                  ordering = "DependencyOrdering.NONE"
                  break;
                case "BEFORE":
                  ordering = "DependencyOrdering.BEFORE"
                  break;
                case "AFTER":
                  ordering = "DependencyOrdering.AFTER"
                  break;
                default:
                  break;
              }
              let side = ""
              switch (dependency.side) {
                case "BOTH":
                  side = "DependencySide.BOTH"
                  break;
                case "CLIENT":
                  side = "DependencySide.CLIENT"
                  break;
                case "SERVER":
                  side = "DependencySide.SERVER"
                  break;
                default:
                  break;
              }
              if (modId === "minecraft") {
                return `minecraft {
                version = this.minecraftVersionRange${dependency.side && dependency.side !== 'BOTH' ? `
                side = ${side}` : ''}${dependency.mandatory !== null && !dependency.mandatory ? `
                mandatory = ${dependency.mandatory}` : ''}${dependency.ordering && dependency.ordering !== 'NONE' ? `
                ordering = ${ordering}` : ''}
            }`
              } else if (modId === "forge") {
                return `forge {
                  version = ">=\${this.forgeVersion}"${dependency.side && dependency.side !== 'BOTH' ? `
                  side = ${side}` : ''}${dependency.mandatory !== null && !dependency.mandatory ? `
                  mandatory = ${dependency.mandatory}` : ''}${dependency.ordering && dependency.ordering !== 'NONE' ? `
                  ordering = ${ordering}` : ''}
            }`
              }
              return `mod(${groovyStringify(modId)}) {
                version = ${groovyStringify(dependency.versionRange ? dependency.versionRange : "")}${dependency.side && dependency.side !== 'BOTH' ? `
                side = ${side}` : ''}${dependency.mandatory !== null && !dependency.mandatory ? `
                mandatory = ${dependency.mandatory}` : ''}${dependency.ordering && dependency.ordering !== 'NONE' ? `
                ordering = ${ordering}` : ''}
            }`
            }).join('\n            ')}
        }` : ''}
    }`
      }).join("\n    ") : ""
    }
}`
      output.innerHTML = hljs.highlight(outString, {language: 'groovy'}).value;
      return;
    } else if (lang === 'json') {
      // eslint-disable-next-line no-template-curly-in-string
      input = input.replace(/\${version}/, "${this.version}")
      // eslint-disable-next-line no-template-curly-in-string
      input = input.replace(/\${group}/, "${this.group}")
      // eslint-disable-next-line no-template-curly-in-string
      input = input.replace(/\${([a-zA-Z0-9_$]*)}/, "${this.buildProperties.$1}")
      let parsed = {};
      try {
        parsed = JSON.parse(input);
      } catch (e) {
        console.log(e);
        output.innerText = "Could not parse JSON.";
        return;
      }
      let outString = `ModsDotGroovy.make {${parsed?.quilt_loader?.metadata?.license ? `
    license = ${groovyStringify(parsed.quilt_loader.metadata.license)}` : ''}${parsed?.quilt_loader?.metadata?.contact?.issues ? `
    issueTrackerUrl = ${groovyStringify(parsed.quilt_loader.metadata.contact.issues)}` : ''}${parsed?.quilt_loader?.metadata?.license ? `
    license = ${groovyStringify(parsed.quilt_loader.metadata.license)}` : ''}
    mod {
        modId = ${groovyStringify(parsed.quilt_loader.id)}
        group = ${groovyStringify(parsed.quilt_loader.group)}${parsed?.quilt_loader?.provides ? `
        provides = ${groovyStringify(parsed.quilt_loader.provides)}` : ''}
        version = ${groovyStringify(parsed.quilt_loader.version)}${parsed?.quilt_loader?.metadata?.name ? `
        displayName = ${groovyStringify(parsed.quilt_loader.metadata.name)}` : ''}${parsed?.quilt_loader?.metadata?.description ? `
        description = ${parsed.quilt_loader.metadata.description.includes('${') ? '"""' : "'''"}${parsed.quilt_loader.metadata.description}${parsed.quilt_loader.metadata.description.includes('${') ? '"""' : "'''"}` : ''}${parsed?.quilt_loader?.metadata?.contact?.homepage ? `
        displayUrl = ${groovyStringify(parsed.quilt_loader.metadata.contact.homepage)}` : ''}${parsed?.quilt_loader?.metadata?.contact ?
          Object.entries(parsed?.quilt_loader?.metadata?.contact)
          .filter(([key, value]) => key !== 'homepage' && key !== 'issues')
          .map(([key, value]) => `
        contact ${groovyStringify(key)}, ${groovyStringify(value)}`).join('') : ''}${parsed?.quilt_loader?.metadata?.contributors ? `
        contributors = ${assembleMapFromObject(flattenContributors(parsed.quilt_loader.metadata.contributors),'        ')}` : ''}${parsed?.quilt_loader?.metadata?.icon ? `
        logoFile = ${groovyStringify(parsed.quilt_loader.metadata.icon)}` : ''}${parsed?.quilt_loader?.entrypoints ? `
        entrypoints {${Object.entries(parsed.quilt_loader.entrypoints).map(([key, value]) => (isValidGroovyName(key) ? `
            ${key} = ${translateEntrypoint(value)}` : `
            entrypoint ${groovyStringify(key)}, ${translateEntrypoint(value, '            ')}`)).join('')}
        }` : ''}${parsed?.quilt_loader?.intermediate_mappings && parsed.quilt_loader.intermediate_mappings !== 'net.fabricmc:intermediary' ? `
        intermediateMappings = ${groovyStringify(parsed.quilt_loader.intermediate_mappings)}` : ''}${parsed?.quilt_loader?.plugins ?`
        plugins = ${assembleFromSingleValue(parsed.quilt_loader.plugins,'        ')}`: ''}${parsed?.quilt_loader?.jars ? `
        jars = ${assembleFromSingleValue(parsed.quilt_loader.jars,'        ')}` : ''}${parsed?.quilt_loader?.language_adapters ? `
        language_adapters = ${assembleFromSingleValue(parsed.quilt_loader.language_adapters,'        ')}` : ''}${parsed?.quilt_loader?.load_type ? `
        load_type = ${assembleFromSingleValue(parsed.quilt_loader.load_type,'        ')}` : ''}${parsed?.quilt_loader?.repositories ? `
        repositories = ${assembleFromSingleValue(parsed.quilt_loader.repositories,'        ')}` : ''}${parsed?.quilt_loader?.depends ? `
        dependencies {
            ${parsed.quilt_loader.depends.map(dependency => assembleDependencyQuilt(dependency,'            ')).join('\n            ')}
        }` : ''}
    }${parsed?.mixin ?`
    mixin = ${assembleFromSingleValue(parsed.mixin,'    ')}`: ''}${parsed?.access_widener ?`
    access_widener = ${assembleFromSingleValue(parsed.access_widener,'    ')}`: ''}${parsed?.minecraft ?`
    minecraft = ${assembleFromSingleValue(parsed.minecraft,'    ')}`: ''}
}`
      output.innerHTML = hljs.highlight(outString, {language: 'groovy'}).value;
      return;
    }
    output.innerHTML = "Unknown language \""+lang+"\"; something has gone terribly wrong";
  }

  render() {
    return (
      <div className='flex-wrapper'>
        <Panel>
          <Panel.Header>
            {"Input"}
          </Panel.Header>
          <Tabs langSetter={this.setLang}>
            <Tab label="mods.toml" lang="toml">
              <InputHighlighted initialValue={defaultModsToml}/>
            </Tab>
            <Tab label="quilt.mod.json" lang="json">
              <InputHighlighted initialValue={defaultQuiltModJson}/>
            </Tab>
          </Tabs>
          <Button color="link" onClick={this.convert}>{"Convert"}</Button>
        </Panel>
        <Panel style={{overflow: "auto"}}>
          <Panel.Header>
            {"Output"}
          </Panel.Header>
          <pre className='flex-inner'>
            <code id='output'>
              {"// Output goes here."}
            </code>
          </pre>
          <Panel.Block renderAs='a' href='https://github.com/lukebemish/modsdotgroovy-converter/'>
            <Panel.Icon>
              <FontAwesomeIcon icon="fa-brands fa-github"/>
            </Panel.Icon>
            View Source on GitHub
          </Panel.Block>
        </Panel>
      </div>
    );
  }
}

export default App;
