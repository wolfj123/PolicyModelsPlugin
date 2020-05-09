import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';

interface Props {
  content: string;
  onFileChange(content: string): void;
}

interface spaceDataSection {
  slot: string;
  name: string;
  shortNote: string;
  longNote: string;
}

const SpaceFileContnet: React.FunctionComponent<Props> = props => {
  const { content, onFileChange } = props;
  const [spaceData, setFileData]: [spaceDataSection[], Dispatch<SetStateAction<spaceDataSection[]>>] = React.useState(
    parseContentToSpaceData(content)
  );

  function parseContentToSpaceData(content): spaceDataSection[] {
    const slotsBlocks = cleanArrayFromSpaces(content.split('#'));
    return slotsBlocks.map(block => {
      const singleSlot: spaceDataSection = {
        slot: '',
        name: '',
        shortNote: '',
        longNote: '',
      };
      const reg = /[^\r\n]+/g;
      const linesWithoutSpaces = block.match(reg);
      const originalStr = linesWithoutSpaces.join('\n');
      let separatedBlocks = originalStr.split('\n---\n');

      while (separatedBlocks.length > 1) {
        singleSlot['longNote'] = separatedBlocks.pop() + singleSlot['longNote'];
      }
      separatedBlocks = separatedBlocks.pop().split('\n');
      if (separatedBlocks.length > 3 && separatedBlocks[3] !== '---') {
        throw new Error('Cannot parse File');
      }

      singleSlot['slot'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      singleSlot['name'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      singleSlot['shortNote'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      return singleSlot;
    });
  }

  React.useEffect(() => onFileChange(parseSpaceDataToContent()), [spaceData]);

  function parseSpaceDataToContent() {
    let newContent = '';
    spaceData.forEach(data => {
      const { slot, name, shortNote, longNote } = data;
      newContent += `# ${slot}\n`;
      name && (newContent += `${name}\n`);
      shortNote && (newContent += `${shortNote}\n`);
      longNote && (newContent += `---\n`);
      longNote && (newContent += `${longNote}\n`);
    });
    return newContent;
  }

  const onChangeInput = (event: any, i, field) => {
    const newValue = event.target.value;
    const newSpaceData = [...spaceData];
    newSpaceData[i][field] = newValue;
    setFileData(newSpaceData);
  };

  const createSlotComponent = (slotData, i) => {
    const { slot, name, shortNote, longNote } = slotData;
    return (
      <div className="slot">
        <h1>{slot}</h1>
        <form>
          <label>
          <p> Name</p>
            <input  style={{ width: '60%'}} type="text" value={name} onChange={e => onChangeInput(e, i, 'name')} />
          </label>
        </form>
        <form>
          <label>
          <p>Short Note</p>
            <input style={{ width: '60%'}} type="text" value={shortNote} onChange={e => onChangeInput(e, i, 'shortNote')} />
          </label>
        </form>
        <form>
          <label>
            <p>Long Note</p>
            <p>
              <textarea style={{ width: '95%', height: '150px' }} value={longNote} onChange={e => onChangeInput(e, i, 'longNote')} />
            </p>
          </label>
        </form>
      </div>
    );
  };
  return <>{spaceData.map(createSlotComponent)}</>;
};

function cleanArrayFromSpaces(array) {
  return array.filter(element => element !== '');
}

export default SpaceFileContnet;
