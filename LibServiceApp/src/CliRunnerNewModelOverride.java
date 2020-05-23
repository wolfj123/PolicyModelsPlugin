import edu.harvard.iq.policymodels.cli.CliRunner;

import java.io.IOException;
import java.util.*;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class CliRunnerNewModelOverride extends CliRunner {

    // keys for JSON information
    public String modelNameKey = "modelName";
    public String modelPathKey = "modelPath";
    public String dgFileNameKey = "dgFileName";
    public String psFileNameKey = "psFileName";
    public String rootSlotKey = "rootSlot";
    public String AuthorsInfoKey = "AuthorsInfo";
    public String personOrGroupKey = "personOrGroup";
    public String AuthorNameKey = "AuthorName";
    public String authorContactKey = "authorContact";

    private String modelNamePrefix = "Model title:";
    private String modelPathPrefix = "Model Path:";
    private String dgFileNamePrefix = "Decision graph filename:";
    private String psFileNamePrefix = "Policy space filename:";
    private String rootSlotNamePrefix = "Root slot name";
    private String addAuthorPrefix = "Add author?";
    private String personOrGroupPrefix = "Person or Group?";
    private String authorNamePrefix = "Name:";
    private String authorContactPrefix = "Contact:";
    private JSONObject userResponse;
    private List<JSONObject> authorsList;
    private Iterator<JSONObject> authorsIterator;
    private JSONObject currentAuthor;

    private String modelPath;
    private String lastMessage;

    public CliRunnerNewModelOverride(String response){
        modelPath = null;
        lastMessage = "";
        authorsList = new LinkedList<>();
        try {
            userResponse = (JSONObject) new JSONParser().parse(response);
            JSONArray authors = (JSONArray) userResponse.getOrDefault(AuthorsInfoKey,null);
            for (var element: authors){
                authorsList.add((JSONObject) element);
            }
            authorsIterator = authorsList.iterator();
        } catch (ParseException e) {
            userResponse =  new JSONObject();

            authorsIterator = new Iterator<JSONObject>() {
                @Override
                public boolean hasNext() {
                    return false;
                }

                @Override
                public JSONObject next() {
                    return null;
                }
            };

        }
    }

    @Override
    public String readLineWithDefault(String command, String defaultValue, Object... args) throws IOException {

        String ans = defaultValue;
        if (command.contains(modelNamePrefix)){
            ans = (String) userResponse.getOrDefault(modelNameKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(modelPathPrefix)){
            ans = (String) userResponse.getOrDefault(modelPathKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(dgFileNamePrefix)){
            ans = (String) userResponse.getOrDefault(dgFileNameKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(psFileNamePrefix)){
            ans = (String) userResponse.getOrDefault(psFileNameKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(rootSlotNamePrefix)){
            ans = (String) userResponse.getOrDefault(rootSlotKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(addAuthorPrefix)) {

            if(authorsIterator.hasNext()){
                currentAuthor = authorsIterator.next();
                return "y";
            }else{
                return "n";
            }

        }else if (command.contains(personOrGroupPrefix)){
            ans = (String) currentAuthor.getOrDefault(personOrGroupKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(authorNamePrefix)){
            ans = (String) currentAuthor.getOrDefault(AuthorNameKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }else if (command.contains(authorContactPrefix)) {
            ans = (String) currentAuthor.getOrDefault(authorContactKey, defaultValue);
            ans = (ans == null || ans.equals("")) ? defaultValue : ans;
        }

        return ans;
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
