import java.util.Map;

public class VisualizeDGHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String outputPath = params.get("outputPath");
        String dotPath = params.get("dotPath");
        PolicyModelService.visualizeDG(outputPath, dotPath);
        return "true";
    }

    @Override
    public String handlePostRequest(String body) {
        return null;
    }
}
