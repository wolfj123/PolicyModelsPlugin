public class MyAuthorData{
    private boolean person;
    private String name;
    private String contact;
    private String affiliation;

    public boolean isPerson() {
        return person;
    }

    public String getName() {
        return name;
    }

    public String getContact() {
        return contact;
    }

    public String getAffiliation() {
        return affiliation;
    }

    public MyAuthorData(boolean isPerson, String name, String contact, String affiliation) {
        this.person = isPerson;
        this.name = name;
        this.contact = contact;
        this.affiliation = affiliation;
    }

    public MyAuthorData(){

    }
}