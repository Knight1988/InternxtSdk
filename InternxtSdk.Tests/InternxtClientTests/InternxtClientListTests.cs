namespace InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientListTests : InternxtClientTestBase
{
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var result = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(result, Is.EqualTo(true));
    }

    [Test]
    public async Task List_ReturnListOfItemInRootFolder()
    {
        var list = await Client.ListAsync();
        Assert.That(list, Is.Not.Null);
        Assert.That(list.Count, Is.GreaterThan(0));
    }

    [Test]
    public async Task List_ReturnListOfItemInTestFolder()
    {
        var list = await Client.ListAsync("498a8bea-56e8-4ac5-83da-5bfef47f19bd");
        Assert.That(list, Is.Not.Null);
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.Multiple(() =>
        {
            Assert.That(list[0].Name, Is.EqualTo("Test Folder"));
            Assert.That(list[0].Type, Is.EqualTo("folder"));
            Assert.That(list[1].Name, Is.EqualTo("SYOHIN.zip"));
            Assert.That(list[1].Type, Is.EqualTo("file"));
        });
    }
}