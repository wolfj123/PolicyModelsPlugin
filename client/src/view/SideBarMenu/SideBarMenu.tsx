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
  if (panelType === PANELS_TYPES.LANGUAGES) {
    menu = languagesMenuData.map((language) => {
      const { onClick, text, isSelected } = language;
      let onClickLanguage = () => {
        setPanelType(PANELS_TYPES.FILES);
        onClick();
      };
      return (
        <IconWrapper icon={'>'} onHover={true}>
          <Text key={text} onClick={onClickLanguage} isSelected={isSelected}>
            {text}
          </Text>
        </IconWrapper>
			);
		});
		menu=[getHeader('Languages'), menu];
	}
	 else if (panelType === PANELS_TYPES.FILES) {
		 const selectedLanguage = languagesMenuData.find(({isSelected}) => isSelected );
		 const selectedLanguageName = selectedLanguage.text;
    menu = filesMenuData.map((file) => {
      const { onClick, text, isSelected } = file;
      return (
        <Text key={text} onClick={onClick} isSelected={isSelected}>
          {text}
        </Text>
      );
    });

    const backButton = (
      <Text key={'back'} onClick={() => setPanelType(PANELS_TYPES.LANGUAGES)} color={'#bfbfbf'} size={'smaller'}>
        {'< Languages'}
      </Text>
    );
    menu = [backButton,getHeader('Files',selectedLanguageName), menu];
  }

  return <div className='menuContainer' >{menu}</div>;
};

export default SideBarMenu;