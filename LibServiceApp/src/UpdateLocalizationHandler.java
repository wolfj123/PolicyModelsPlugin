import java.util.Map;

public class UpdateLocalizationHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        return PolicyModelService.updateLocalization();
    }

    @Override
    public Pair<Integer, String> handlePostRequest(String body) {
        return null;
    }
}
