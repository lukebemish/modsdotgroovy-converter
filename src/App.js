import './App.scss';
import 'highlight.js/styles/atom-one-light.css';
import { Button, Panel } from 'react-bulma-components';
import React from 'react';
import { parse as parseTOML } from 'toml';

const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('groovy', require('highlight.js/lib/languages/groovy'));

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
      try {
        const parsed = parseTOML(input);
        let outString = `ModsDotGroovy.make {
    modLoader = "${parsed.modLoader}"
    loaderVersion = "${parsed.loaderVersion}"
    license = "${parsed.license}"${parsed.issueTrackerUrl ? `
    issueTrackerUrl = "${parsed.issueTrackerUrl}"` : ''}${parsed.showAsResourcePack ? `
    showAsResourcePack = "${parsed.showAsResourcePack}"` : ''}
}`
        output.innerHTML = hljs.highlight(outString, {language: 'groovy'}).value;
      } catch (e) {
        console.log(e);
        output.innerText = "Could not parse TOML.";
      }
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
        <Panel>
          <Panel.Header>
            {"Output"}
          </Panel.Header>
          <pre className='flex-inner'>
            <code id='output'>
              {"// Output goes here."}
            </code>
          </pre>
        </Panel>
      </div>
    );
  }
}

export default App;
