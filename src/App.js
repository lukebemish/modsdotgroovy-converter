import './App.scss';
import 'highlight.js/styles/atom-one-light.css';
import { Button, Panel } from 'react-bulma-components';
import React from 'react';
import { parse as parseTOML } from 'toml';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

library.add(faGithub)

const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('groovy', require('highlight.js/lib/languages/groovy'));

function assembleMapFromObject(obj, prefix) {
  let out = '[\n'
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      out += prefix+'    "'+key + '": "' +assembleListFromArray(value, '    '+prefix)+",\n"
    } else if (typeof value === 'object') {
      out += prefix+'    "'+key + '": "' +assembleMapFromObject(value, '    '+prefix)+",\n"
    } else if (typeof value === 'string') {
      out += prefix+'    "'+key + '": "' + value + '",\n'
    }else {
      out += prefix+'    "'+key + '": ' + value + ',\n'
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
      out += prefix+'    "' + value + '",\n'
    }else {
      out += prefix+'    '+value + ',\n'
    }
  }
  return out.substring(0,out.length-1) + '\n'+prefix+']'
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
    const input = document.querySelector('.contents-switchable textarea').value;
    const lang = this.state.lang;
    const output = document.querySelector('#output');
    if (lang === 'toml') {
      let parsed = {};
      try {
        parsed = parseTOML(input);
      } catch (e) {
        console.log(e);
        output.innerText = "Could not parse TOML.";
        return;
      }
        let outString = `ModsDotGroovy.make {
    modLoader = "${parsed.modLoader}"
    loaderVersion = "${parsed.loaderVersion}"
    license = "${parsed.license}"${parsed.issueTrackerUrl ? `
    issueTrackerUrl = "${parsed.issueTrackerUrl}"` : ''}${parsed.showAsResourcePack ? `
    showAsResourcePack = ${parsed.showAsResourcePack}` : ''}${
      parsed.mods ? "\n    "+parsed.mods.map(element => {
        return `mod {
        modId = "${element.modId}"
        version = "${element.version ? element.version : '1'}"${element.displayName ? `
        displayName = "${element.displayName}"` : ''}${element.description ? `
        description = """
${element.description}"""` : ''}${element.logoFile ? `
        logoFile = "${element.logoFile}"` : ''}${element.logoBlur ? `
        logoBlur = ${element.logoBlur}` : ''}${element.credits ? `
        credits = "${element.credits}"` : ''}${element.authors ? `
        authors = [${element.authors.split(/, and |, | and /).filter(author => author).map(author => author.trim()).filter(n => n).map(author => `"${author}"`).join(', ')}]` : ''}${element.displayURL ? `
        displayUrl = "${element.displayURL}"` : ''}${element.updateJSONURL ? `
        updateJsonUrl = "${element.updateJSONURL}"` : ''}${element.modproperties ? `
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
              return `mod("${modId}") {
                version = "${dependency.versionRange ? dependency.versionRange : ""}"${dependency.side && dependency.side !== 'BOTH' ? `
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
      output.innerText = "Conversion from JSON is not supported yet.";
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
              <InputHighlighted initialValue="# Paste mods.toml here."/>
            </Tab>
            <Tab label="quilt.mod.json" lang="json">
              <InputHighlighted initialValue="// Paste quilt.mod.json here."/>
            </Tab>
          </Tabs>
          <Button onClick={this.convert}>{"Convert"}</Button>
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
