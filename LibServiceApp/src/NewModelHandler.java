import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class NewModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        return null;
    }

    @Override
    public Pair<Integer, String> handlePostRequest(String body) {
        if (body == null || body.equals("")){
            return  new Pair<>(501, "Bad Model description");
        }
        NewModelInputData inputData;
        ObjectMapper mapper = new ObjectMapper();
        try {
            inputData = mapper.readValue(body,NewModelInputData.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new Pair<>(501, "Can't parse JSON to object");
        }

        CliRunnerNewModelOverride cli = new CliRunnerNewModelOverride(inputData);
        try {
            return PolicyModelService.createNewModel(cli);
        }catch (Exception ex){
            return  new Pair<>(510, "Unknown Error");
        }
    }




}
