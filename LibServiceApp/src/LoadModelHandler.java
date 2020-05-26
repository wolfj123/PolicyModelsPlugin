import java.util.Map;

public class LoadModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String path = params.get("path");
        return PolicyModelService.loadPolicyModel(path);
    }

    @Override
    public Pair<Integer, String> handlePostRequest(String body) {
        return null;
    }
}