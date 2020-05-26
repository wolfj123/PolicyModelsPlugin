import edu.harvard.iq.policymodels.cli.CliRunner;

import java.io.IOException;

public class CliRunnerNewModelOverride extends CliRunner {

/*    // keys for JSON information
    public String modelNameKey = "modelName";
    public String modelPathKey = "modelPath";
    public String dgFileNameKey = "dgFileName";
    public String psFileNameKey = "psFileName";
    public String rootSlotKey = "rootSlot";
    public String AuthorsInfoKey = "AuthorsInfo";
    public String personOrGroupKey = "personOrGroup";
    public String AuthorNameKey = "AuthorName";
    public String authorContactKey = "authorContact";*/

    private String modelNamePrefix = "Model title:";
    private String modelPathPrefix = "Model Path:";
    private String dgFileNamePrefix = "Decision graph filename:";
    private String psFileNamePrefix = "Policy space filename:";
    private String rootSlotNamePrefix = "Root slot name";
    private String addAuthorPrefix = "Add author?";
    private String personOrGroupPrefix = "Person or Group?";
    private String authorNamePrefix = "Name:";
    private String authorContactPrefix = "Contact:";
    private String authorAffiliationPrefix = "Affiliation:";
/*    private JSONObject userResponse;
    private List<JSONObject> authorsList;
    private Iterator<JSONObject> authorsIterator;
    private JSONObject currentAuthor;*/

    private String lastMessage;
    private NewModelInputData modelData;
    private String modelPath;

    public CliRunnerNewModelOverride(NewModelInputData inputData) {
        modelData = inputData;
    }

    @Override
    public String readLineWithDefault(String command, String defaultValue, Object... args) throws IOException {

        if (command.contains(modelNamePrefix)){
            return modelData.getModelName();
        }else if (command.contains(modelPathPrefix)){
            return modelData.getModelPath();
        }else if (command.contains(dgFileNamePrefix)){
            return modelData.getDgFileName();
        }else if (command.contains(psFileNamePrefix)){
            return modelData.getPsFileName();
        }else if (command.contains(rootSlotNamePrefix)){
            return modelData.getRootSlot();
        }else if (command.contains(addAuthorPrefix)) {
            if (modelData.hasMoreAuthors()) {
                modelData.nextAuthor();
                return "y";
            }else{
                return "n";
            }
        }else if (command.contains(personOrGroupPrefix)){
            return modelData.isAuthorPerson() ? "p" : "g";
        }else if (command.contains(authorNamePrefix)){
            return modelData.getAuthorName();
        }else if(command.contains(authorAffiliationPrefix)){
            return modelData.getAuthorAffiliation();
        }else if (command.contains(authorContactPrefix)) {
            return modelData.getAuthorContact();
        }

        return defaultValue;
    }

    @Override
    public String readLine(String format, Object... args) throws IOException {
        return readLineWithDefault(format,"no_default",args);
    }

    @Override
    public void print(String format){
        handlePrint(format);
    }

    @Override
    public void println(String format, Object... args) {
//        super.println(format, args);
        handlePrint(format, args);
    }

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
        String modelCreationPrefix = "Creating model at ";
        if (msg.startsWith(modelCreationPrefix)){
            String tempPath = msg.substring(modelCreationPrefix.length()).trim();
            int idx = tempPath.lastIndexOf("...");
            modelPath = tempPath.substring(0,idx);
        }else{
            lastMessage = String.format(msg, args);
        }
    }

    public String getModelPath() {
        return modelPath;
    }

    public String getLastMessage() {
        return lastMessage;
    }
}
