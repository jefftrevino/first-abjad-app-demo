import * as React from "react";
import {
  Cell,
  Input,
  Prompt,
  Source,
  Outputs
} from "@nteract/presentational-components";

const transforms = require("@nteract/transforms");
const messaging = require("@nteract/messaging");

import CodeMirrorEditor from "@nteract/editor";

export default class PresentationCell extends React.Component {
  constructor(props) {
    super(props);
    this.submit = () => {
      console.log("Submitting", this.state.source);
      if (this.props.kernel && this.props.kernel.channels) {
        this.props.kernel.channels.next(
          messaging.executeRequest(this.state.source)
        );
        console.log("submitted!");
      } else {
        console.warn(
          "Could not submit, kernel not connected"
        );
      }
    };
    this.state = {
      source: "import abjad\n%load_ext abjadext.ipython\nnote = abjad.Note()\nabjad.show(note)",
      codeMirrorOptions: {
        extraKeys: {
          "Ctrl-Space": "autocomplete",
          "Shift-Enter": this.submit,
          "Ctrl-Enter": this.submit,
          "Cmd-Enter": this.submit
        },
        mode: "python"
      }
    };
  }

  render() {
    const outputs = _.map(
      this.props.messageCollections,
      (collection, parent_id) => {
        return _.map(collection, msg => {
          switch (msg.msg_type) {
            case "execute_result":
            case "display_data":
              if (msg.content.data) {
                const mimetype = transforms.richestMimetype(
                  msg.content.data
                );
                if (!mimetype) {
                  return null;
                }
                const Transform =
                  transforms.transforms[mimetype];

                return (
                  <Transform
                    key={msg.header.msg_id}
                    data={msg.content.data[mimetype]}
                  />
                );
              }
            case "stream":
              return (
                <pre key={msg.header.msg_id}>
                  {msg.content.text}
                </pre>
              );
            default:
              return null;
          }
        }).filter(x => x !== null);
      }
    ).filter(x => x.length !== 0);

    return (
      <div className="presentational">
        <Cell isSelected>
          <Input>
            <Prompt buffer />
            <Source>
              <CodeMirrorEditor
                options={this.state.codeMirrorOptions}
                onChange={source =>
                  this.setState({
                    source
                  })
                }
                value={this.state.source}
              />
            </Source>
          </Input>
          {outputs && outputs.length > 0 ? (
            <Outputs>{outputs}</Outputs>
          ) : null}
        </Cell>
      </div>
    );
  }
}

PresentationCell.defaultProps = {
  children: "",
  kernel: null
};
