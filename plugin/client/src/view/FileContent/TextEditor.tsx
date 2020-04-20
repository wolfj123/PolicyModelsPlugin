import * as React from 'react';

interface Props {
	content: string;
	onFileChange(content: string): void;
}

const TextEditor: React.FunctionComponent<Props> = (props) => {
  const {content} = props;

	const textEditorStyle={
		width: '100%',
		height: '100vh',
		backgroundColor: 'transparent',
		color: 'white'
	}
  return <div>
	 <textarea style={textEditorStyle} value={content} onChange={e => console.log(e)} />
	</div>;
}

export default TextEditor;
