import * as React from 'react';

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

interface spaceData {
  spaceData: spaceDataSection[];
}

const SpaceFileContnet: React.FunctionComponent<Props> = props => {
  const { content  /* ,onFileChange */  } = props;
  const [spaceData,  setFileData] = React.useState(parseContentToAnswers(content));

  function parseContentToAnswers(content): spaceData[] {
    const slotsBlocks = cleanArrayFromSpaces(content.split('#'));
    return slotsBlocks.map(block => {
      const singleSlot = {};
      const reg = /[^\r\n]+/g;
      const linesWithoutSpaces = block.match(reg);
      const originalStr = linesWithoutSpaces.join('\n');
      let separatedBlocks = originalStr.split('\n---\n');
      if (separatedBlocks.length > 2) {
        throw new Error('Cannot parse File');
      }

      if (separatedBlocks.length === 2) {
        singleSlot['longNote'] = separatedBlocks.pop();
      }
      separatedBlocks = separatedBlocks.pop().split('\n');
      if (separatedBlocks.length > 3) {
        throw new Error('Cannot parse File');
      }

      singleSlot['slot'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      singleSlot['name'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      singleSlot['shortNote'] = separatedBlocks.length > 0 ? separatedBlocks.shift() : '';
      return singleSlot;
    });
  }

  // React.useEffect(() => onFileChange(parseAnswerDataToContent()), [answersData]);

  // function parseAnswerDataToContent() {
  // return '';
  // }

  // function onChangeInput(text, newValue) {

	// }

	const onChangeInput = (event: any,i,field) => {
		const newValue = event.target.value;
		const newSpaceData=[...spaceData];
		newSpaceData[i][field] = newValue;;
		setFileData(newSpaceData);
  };

  const createSlotComponent = (slotData,i) => {
    const { slot, name, shortNote, longNote } = slotData;
    return (
      <div className="slot">
        <h1>{slot}</h1>
        <form>
          <label>
            Name
            <br />
            <input type="text" value={name} onChange={e => onChangeInput(e,i,'name')}/>
          </label>
        </form>
        <form>
          <label>
            Short Note
            <br />
            <input type="text" value={shortNote} onChange={e => onChangeInput(e,i,'shortNote')} />
          </label>
        </form>
        <form>
          <label>
            Long Note
            <p>
              <textarea style={{ width: '100%', height: '150px' }} value={longNote} onChange={e => onChangeInput(e,i,'longNote')} />
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
