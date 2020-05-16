public class UpdateLocalizationHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(String params) throws Exception {
        PolicyModelService.updateLocalization();
        return "true";
    }

    @Override
    public String handlePostRequest(String params) {
        return null;
    }
}
