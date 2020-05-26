import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.NewModelCommand;
import org.parboiled.common.Tuple2;

import javax.swing.*;

public class NewModelHandler extends PolicyModelHttpHandler {

    private boolean waitingForUser;
    private NewModelInputData modelData;

    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        return null;
    }

    @Override
    public Tuple2<Integer,String> handlePostRequest(String body) {
        if (body == null || body.equals("")){
            return  new Tuple2<>(501, "Bad Model description");
        }
        NewModelInputData inputData;
        ObjectMapper mapper = new ObjectMapper();
        try {
            inputData = mapper.readValue(body,NewModelInputData.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new Tuple2<>(501, "Can't parse JSON to object");
        }

        CliRunnerNewModelOverride cli = new CliRunnerNewModelOverride(inputData);
        try {
            return PolicyModelService.createNewModel(cli);
        }catch (Exception ex){
            return  new Tuple2<>(510, "Unknown Error");
        }
    }




}
