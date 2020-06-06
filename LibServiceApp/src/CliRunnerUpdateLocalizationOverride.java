import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.harvard.iq.policymodels.cli.CliRunner;

public class CliRunnerUpdateLocalizationOverride extends CliRunner {
    private String modelPath;
    private boolean nextMessageNeedToBeSave;
    public String answersToRemove = null;

    @Override
    public void println(String format) {
//        super.println(format);
        handlePrint(format);
    }

    @Override
    public void printMsg(String format, Object... args) {
//        super.printMsg(format, args);
        handlePrint(format, args);
    }

    @Override
    public void printWarning(String format, Object... args) {
//        super.printWarning(format, args);
        handlePrint(format, args);
    }

    @Override
    public void printWarning(String format) {
//        super.printWarning(format);
        handlePrint(format);
    }

    private void handlePrint (String msg, Object... args){
        String modelCreationPrefix = "Answers that can be removed:";
        System.out.println(msg);
        if(nextMessageNeedToBeSave){
            nextMessageNeedToBeSave = false;
            answersToRemove = convert(msg);
        }

        if (msg.startsWith(modelCreationPrefix)){
            nextMessageNeedToBeSave = true;
        }

    }

    private String convert(String answers){
        ObjectMapper objectMapper = new ObjectMapper();
        String [] splitted = answers.split("\n");
        for(int i=0;i<splitted.length;i++){
            splitted[i] = splitted[i].substring(3);
        }
        try {
            return objectMapper.writeValueAsString(splitted);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return "b";
    }
}
