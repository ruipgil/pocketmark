var background = {
  start: function() {
    console.log("start");
    chrome.runtime.sendMessage({start:true});
  },
  stop: function() {
    console.log("stop");
    chrome.runtime.sendMessage({stop:true});
  },
  restart: function() {
    console.log("restart");
    chrome.runtime.sendMessage({restart:true});
  }
};

function removeSpaces(str) {
  return str.toLowerCase().trim().replace(" ", "");
}
/*
  receives:
    + array of options
      - value
      - text
    + label text
    + help text
    + id
    + value
 */
var SelectBox = React.createClass({
  getInitialState: function() {
    return {value:""};
  },
  handleChange: function(e) {
    this.setState({value: e.target.value});
  },
  componentWillMount: function() {
    this.props.id = removeSpaces(this.props.label);
    this.setState({value: this.props.value});
  },
  getValue: function() {
    return this.state.value;
  },
  render: function() {
    var options = this.props.options.map(function(opt){
      return (
        <option value={opt.value} key={opt.value}>
          {opt.text}
        </option>
      );
    });
    var id = this.props.id;
    return (
      <div className="form-group">
        <label htmlFor={id} className="col-sm-4 control-label">{this.props.label}</label>
        <div className="col-sm-8">
          <select className="form-control" id={id} value={this.state.value} ref="option">
            {options}
          </select>
          <span className="help-block">{this.props.help}</span>
        </div>
      </div>
    );
  }
});

/*
  receives;
    + placeholder
    + value
    + label
    + help
    + id
 */
var InputBox = React.createClass({
  getInitialState: function() {
    return {value:""};
  },
  handleChange: function(e) {
    this.setState({value: e.target.value});
  },
  componentWillMount: function() {
    this.props.id = removeSpaces(this.props.label);
    this.setState({value: this.props.value});
  },
  getValue: function() {
    return this.state.value;
  },
  render: function() {
    var id = this.props.id;
    return (
      <div className="form-group">
        <label htmlFor={id} className="col-sm-4 control-label">{this.props.label}</label>
        <div className="col-sm-8">
          <input type="text" className="form-control" id={id} placeholder={this.props.placeholder} onChange={this.handleChange} value={this.state.value} ref="text" />
          <span className="help-block">{this.props.help}</span>
        </div>
      </div>
    );
  }
});

var SettingsForm = React.createClass({
  handleSubmit: function(e) {
    var obj = {};
    for(var x in this.refs) {
      obj[x] = this.refs[x].getValue();
    }
    this.props.onSave(obj);
  },
  render: function() {
    var data = this.props.data;

    return (
      <form className="form-horizontal" >
        <InputBox
          label="Tag"
          help="Items with the tag to be imported"
          placeholder="pocketmark"
          ref="tag"
          value={data.tag} />
        <SelectBox
          label="State"
          help="The state of items to be imported"
          options={[{value: Pocket.STATE.ALL, text: "All"}, {value: Pocket.STATE.UNREAD, text: "Unread"}, {value: Pocket.STATE.ARCHIVE, text: "Archived"}]}
          ref="state"
          value={data.state} />
        <InputBox
          label="Destination folder"
          help="Name of the folder to be created. If the folder doesn't exist it will be created. If it is changed it will not remove the bookmark from it. If you type a folder that already exists, the items in there might be deleted!"
          placeholder="pocketmark"
          ref="target_folder"
          value={data.target_folder} />
        <SelectBox
          label="Save to pocket"
          help="If yes, bookmarks added from now on will be added to pocket, with your current tag to import"
          options={[{value: "0", text: "No"}, {value: "1", text: "Yes"}]}
          ref="saveToPocket"
          value="0" />
        <SelectBox
          label="Update interval"
          help="Time interval to update your pocketmarks"
          options={[
            {value: "1", text: "Every second"},
            {value: "5", text: "Every 5 seconds"},
            {value: "10", text: "Every 10 seconds"},
            {value: "30", text: "Every 30 seconds"},
            {value: "60", text: "Every minute"},
            {value: "300", text: "Every 5 minutes"},
            {value: "600", text: "Every 10 minutes"},
            {value: "1800", text: "Every 30 minutes"},
            {value: "3600", text: "Every hour"}
            ]}
          ref="interval"
          value={data.interval} />
        <SelectBox
          label="Sync"
          help="Stores credentials and settings through your google account. You won't need to login and reconfigure your settings when you use chrome in another computer"
          options={[{value: "0", text: "No"}, {value: "1", text: "Yes"}]}
          ref="sync"
          value="0" />
        <div className="form-group">
          <div className="col-sm-offset-4 col-sm-8">
            <button className="btn btn-primary" onClick={this.handleSubmit}>Save</button>
          </div>
        </div>
      </form>
    );
  }
});

var Login = React.createClass({
  handleLogin: function() {
    login(function(err) {
      // TODO error handling
      this.props.callback();
    }.bind(this));
  },
  render: function() {
    return (
      <p className="text-center">
        <button type="button" className="btn btn-danger btn-lg" onClick={this.handleLogin}>Login with pocket</button>
      </p>
    );
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    storage.getAll(function(data) {
      console.log("storage.data", data);
      this.setState(data);
    }.bind(this));
  },
  onSave: function(options) {
    console.log("set options", options);
    this.setState(options);
    storage.set(options);
    background.restart();
  },
  handleLogout: function() {
    storage.clear(function() {
      this.setState({username: undefined, access_token: undefined});
      background.stop();
    }.bind(this));
  },
  handleLogin: function() {
    storage.getAll(function(data) {
      console.log("login: storage.data", data);
      this.setState(data);
      background.start();
    }.bind(this));
  },
  render: function() {
    if(this.state.username) {
      return (
        <div>
          <p className="text-center">
            Hello {this.state.username}, <button type="button" className="btn btn-danger btn-sm" onClick={this.handleLogout}>Logout</button>
          </p>
          <h2>Settings</h2>
          <SettingsForm data={this.state} onSave={this.onSave} />
        </div>
      );
    }else {
      return (
        <Login callback={this.handleLogin} />
      )
    }
  }
});

React.render(
  <App />,
  document.getElementById('target')
  );