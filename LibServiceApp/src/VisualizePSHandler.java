import java.util.Map;

public class VisualizePSHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String outputPath = params.get("outputPath");
        String dotPath = params.get("dotPath");
        PolicyModelService.visualizePS(outputPath, dotPath);
        return "true";
    }

    @Override
    public Pair<Integer, String> handlePostRequest(String body) {
        return null;
    }

}
