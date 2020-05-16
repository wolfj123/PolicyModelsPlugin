
public class CreateNewLocalizationhandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(String params) throws Exception {
        String name = params;
        return PolicyModelService.createNewLocalization(name);
    }

    @Override
    public String handlePostRequest(String params) {
        return null;
    }
}