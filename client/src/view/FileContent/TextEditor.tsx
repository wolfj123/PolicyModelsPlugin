import * as React from 'react';
import './TextEditor.css';

/**
 * This component responsible to render the free markdown editor.
 * @param   {string} content    file content
 * @param   {onSaveCallback} onFileChange    onFileChange handler
*/

interface Props {
	content: string;
	onFileChange(content: string): void;
}

const TextEditor: React.FunctionComponent<Props> = (props) => {
	const {content ,onFileChange} = props;
	const[textAreaContent, setTextAreaContent] = React.useState(content); 	//react bug. needs to handle internal state to prevent textarea bug.

	const handleChange = newContent =>{
		setTextAreaContent(newContent);
		onFileChange(newContent);
	}

  return <div>
	 <textarea className="text1" value={textAreaContent} onChange={(e: any) => handleChange(e.target.value)}/>
	</div>;
}

export default TextEditor;
