
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


import java.util.Collections;
import java.util.Iterator;
import java.util.List;

@JsonIgnoreProperties(value ={"authorContact","authorName","authorPerson","authorAffiliation"})
public class NewModelInputData {



    private String modelName;
    private String modelPath;
    private String dgFileName;
    private String psFileName;
    private String rootSlot;
    private List<MyAuthorData> authors;
    private Iterator<MyAuthorData> authorsIterator;
    private MyAuthorData currentAuthor;

    public String getModelName() {
        return modelName;
    }

    public String getModelPath() {
        return modelPath;
    }

    public String getDgFileName() {
        return dgFileName;
    }

    public String getPsFileName() {
        return psFileName;
    }

    public String getRootSlot() {
        return rootSlot;
    }

    public List<MyAuthorData> getAuthors(){
        return this.authors;
    }

    // this is needed for JSON
    public NewModelInputData(){

    }

    public NewModelInputData(String modelName, String modelPath, String dgFileName, String psFileName,
                             String rootSlot, List<MyAuthorData> authors){
        setAllData(modelName, modelPath, dgFileName, psFileName, rootSlot, authors);
    }

    private void setAllData(String modelName, String modelPath, String dgFileName, String psFileName,
                           String rootSlot, List<MyAuthorData> authors) {
        this.modelName = modelName;
        this.modelPath = modelPath;
        this.dgFileName = dgFileName;
        this.psFileName = psFileName;
        this.rootSlot = rootSlot;
        this.authors = authors != null ? authors : Collections.emptyList();
        this.authorsIterator = this.authors.iterator();
        this.currentAuthor = null;
    }

    public boolean hasMoreAuthors() {
        if (authorsIterator == null){
            this.authorsIterator = this.authors.iterator();
        }
        return this.authorsIterator.hasNext();
    }

    public void nextAuthor() {
        this.currentAuthor = this.authorsIterator.next();
    }

    public boolean isAuthorPerson(){
        return this.currentAuthor.isPerson();
    }

    public String getAuthorName(){
        return this.currentAuthor.getName();
    }

    public String getAuthorContact(){
        return this.currentAuthor.getContact();
    }

    public String getAuthorAffiliation(){
        return this.currentAuthor.getAffiliation();
    }
}