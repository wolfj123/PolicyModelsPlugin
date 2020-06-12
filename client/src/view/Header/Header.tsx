import * as React from 'react';
import './Header.css';

interface Props {
  onCreateNewLanguage(): void;
}

/**
 * Top header component.
 * Includes the create new localization operation and
 * symbols map for the editor
 *
 * @param  {onCreateNewLanguageCallBack} onCreateNewLanguage onCreateNewLanguage callback
*/

const Header: React.FunctionComponent<Props> = (props) => {
  const { onCreateNewLanguage } = props;
  return (
    <div className="container1">
				Actions:
      <div className="option addIcon" onClick={onCreateNewLanguage}>
        <div
          style={{ display: 'flex',margin: '0 10px' }}
          dangerouslySetInnerHTML={{
            __html:
              '<svg style="height: 20px; width: 20px;fill: white;" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m368 272h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0"/><path d="m256 384c-8.832031 0-16-7.167969-16-16v-224c0-8.832031 7.167969-16 16-16s16 7.167969 16 16v224c0 8.832031-7.167969 16-16 16zm0 0"/><path d="m453.332031 512h-394.664062c-32.363281 0-58.667969-26.304688-58.667969-58.667969v-394.664062c0-32.363281 26.304688-58.667969 58.667969-58.667969h394.664062c32.363281 0 58.667969 26.304688 58.667969 58.667969v394.664062c0 32.363281-26.304688 58.667969-58.667969 58.667969zm-394.664062-480c-14.699219 0-26.667969 11.96875-26.667969 26.667969v394.664062c0 14.699219 11.96875 26.667969 26.667969 26.667969h394.664062c14.699219 0 26.667969-11.96875 26.667969-26.667969v-394.664062c0-14.699219-11.96875-26.667969-26.667969-26.667969zm0 0"/></svg>',
          }}
        />
        Create new language
      </div>
      <div style={{ height: '15px', width: '1px', backgroundColor: 'white', marginRight: '4px' }}></div>
			Symbols:
      <div className="option">
        <div
          style={{ display: 'flex', margin: '0 10px' }}
          dangerouslySetInnerHTML={{
            __html:
              '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"	 viewBox="0 0 512.001 512.001" style="height: 20px; width: 20px;fill: #ad1e1e;" xml:space="preserve"><g>	<g>		<path d="M503.839,395.379l-195.7-338.962C297.257,37.569,277.766,26.315,256,26.315c-21.765,0-41.257,11.254-52.139,30.102			L8.162,395.378c-10.883,18.85-10.883,41.356,0,60.205c10.883,18.849,30.373,30.102,52.139,30.102h391.398			c21.765,0,41.256-11.254,52.14-30.101C514.722,436.734,514.722,414.228,503.839,395.379z M477.861,440.586			c-5.461,9.458-15.241,15.104-26.162,15.104H60.301c-10.922,0-20.702-5.646-26.162-15.104c-5.46-9.458-5.46-20.75,0-30.208			L229.84,71.416c5.46-9.458,15.24-15.104,26.161-15.104c10.92,0,20.701,5.646,26.161,15.104l195.7,338.962			C483.321,419.836,483.321,431.128,477.861,440.586z"/>	</g></g><g>	<g>		<rect x="241.001" y="176.01" width="29.996" height="149.982"/>	</g></g><g>	<g>		<path d="M256,355.99c-11.027,0-19.998,8.971-19.998,19.998s8.971,19.998,19.998,19.998c11.026,0,19.998-8.971,19.998-19.998			S267.027,355.99,256,355.99z"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>',
          }}
        />
        * Cab be deleted
      </div>
    </div>
  );
};
export default Header;
