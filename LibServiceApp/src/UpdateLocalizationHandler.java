import java.util.Map;

public class UpdateLocalizationHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        PolicyModelService.updateLocalization();
        return "true";
    }

    @Override
    public String handlePostRequest(String body) {
        return null;
    }
}
