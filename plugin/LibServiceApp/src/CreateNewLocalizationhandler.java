
public class CreateNewLocalizationhandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(String params) throws Exception {
        String name = params;
        PolicyModelService.createNewLocalization(name);
        return "true";
    }

    @Override
    public String handlePostRequest(String params) {
        return null;
    }
}