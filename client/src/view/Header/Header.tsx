import * as React from 'react';
import './Header.css';


interface Props {
	onCreateNewLanguage(): void;
}

const Header: React.FunctionComponent<Props> = (props) => {
const {onCreateNewLanguage} = props;
	return <div className="container1">
		<div className="option">
			<div className="addIcon" onClick={onCreateNewLanguage}>
			<div style={{display: 'flex'}} dangerouslySetInnerHTML={{ __html: '<svg style="height: 20px; width: 20px;fill: white;" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m368 272h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0"/><path d="m256 384c-8.832031 0-16-7.167969-16-16v-224c0-8.832031 7.167969-16 16-16s16 7.167969 16 16v224c0 8.832031-7.167969 16-16 16zm0 0"/><path d="m453.332031 512h-394.664062c-32.363281 0-58.667969-26.304688-58.667969-58.667969v-394.664062c0-32.363281 26.304688-58.667969 58.667969-58.667969h394.664062c32.363281 0 58.667969 26.304688 58.667969 58.667969v394.664062c0 32.363281-26.304688 58.667969-58.667969 58.667969zm-394.664062-480c-14.699219 0-26.667969 11.96875-26.667969 26.667969v394.664062c0 14.699219 11.96875 26.667969 26.667969 26.667969h394.664062c14.699219 0 26.667969-11.96875 26.667969-26.667969v-394.664062c0-14.699219-11.96875-26.667969-26.667969-26.667969zm0 0"/></svg>' }} />
			</div>
			Create new language
		</div>
	</div>

}
export default Header;