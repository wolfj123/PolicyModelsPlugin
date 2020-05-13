public class LoadModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(String params) throws Exception {
        String path = params;
        PolicyModelService.loadPolicyModel(path);
        return "true";
    }

    @Override
    public String handlePostRequest(String params) {
        return null;
    }
}