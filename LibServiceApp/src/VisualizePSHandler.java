import java.util.Map;

public class VisualizePSHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String outputPath = params.get("outputPath");
        PolicyModelService.visualizePS(outputPath);
        return "true";
    }

    @Override
    public String handlePostRequest(String body) {
        return null;
    }
}
