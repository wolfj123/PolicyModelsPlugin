import * as React from 'react';
import Text from '../Text/Text';
import IconWrapper from '../Text/IconWrapper';
import { ItemMenuData } from '../Types/model';
import './SideBarMenu.css';

const PANELS_TYPES = {
  LANGUAGES: 'LANGUAGES',
  FILES: 'FILES',
};
interface Props {
  languagesMenuData: ItemMenuData[];
  filesMenuData: ItemMenuData[];
}

const SideBarMenu: React.FunctionComponent<Props> = ({ languagesMenuData, filesMenuData }) => {
  const [panelType, setPanelType] = React.useState(PANELS_TYPES.LANGUAGES);

  const getHeader = (text,subText?) =>
    <div style={{ marginBottom: '10px'}}>
      <Text key={text} size={'large'}>
        {text}
      </Text>
			{subText && <Text key={subText} size={'smaller'}>
        {subText}
      </Text>}
			<div className={'hr'}/>
    </div>;
  ;

  let menu;
  let header;
  let backButton;
  if (panelType === PANELS_TYPES.LANGUAGES) {
    menu = languagesMenuData.map((language) => {
      const { onClick, text, isSelected,id } = language;
      let onClickLanguage = () => {
        setPanelType(PANELS_TYPES.FILES);
        onClick();
      };
      return (
        <IconWrapper key={id} icon={' >'} onHover={true}>
          <Text key={text} onClick={onClickLanguage} isSelected={isSelected}>
            {text}
          </Text>
        </IconWrapper>
			);
    });
    header = getHeader('Languages');
	}
	 else if (panelType === PANELS_TYPES.FILES) {
		 const selectedLanguage = languagesMenuData.find(({isSelected}) => isSelected );
		 const selectedLanguageName = selectedLanguage.text;
    menu = filesMenuData.map((file) => {
      const { onClick, text, isSelected,id } = file;
      return (
        <Text key={id} onClick={onClick} isSelected={isSelected}>
          {text}
        </Text>
      );
    });

     backButton = (
      <Text key={'back'} onClick={() => setPanelType(PANELS_TYPES.LANGUAGES)} color={'#bfbfbf'} size={'smaller'}>
        {'< Languages'}
      </Text>
    );
    header = getHeader('Files',selectedLanguageName);
  }

  return <div className='menuContainer' >
    {backButton}
    {header}
    <div className="scrollable">
    {menu}
    </div>

    </div>;
};

export default SideBarMenu;
