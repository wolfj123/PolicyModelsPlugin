import java.util.Map;

public class CreateNewLocalizationhandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String name = params.get("name");
        return PolicyModelService.createNewLocalization(name);
    }

    @Override
    public String handlePostRequest(String body) {
        return null;
    }
}