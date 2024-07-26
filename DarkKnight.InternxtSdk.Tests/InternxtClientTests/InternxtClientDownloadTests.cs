using FluentAssertions;
using DarkKnight.InternxtSdk.Exceptions;

namespace DarkKnight.InternxtSdk.Tests.InternxtClientTests;

[TestFixture]
public class InternxtClientDownloadTests : InternxtClientTestBase
{
    private string _fileId;
    
    public override async Task Setup()
    {
        await base.Setup();
        var loginData = GetTestLogin();
        var loginResult = await Client.LoginAsync(loginData.Username, loginData.Password);
        Assert.That(loginResult, Is.EqualTo(true));
        // create test folder
        var folderId = await Client.CreateFolderAsync(TestFolderName);
        // Upload a file
        
        var uploadResult = await Client.UploadAsync(TestFilePath, folderId);
        Assert.Multiple(() =>
        {
            Assert.That(uploadResult.FileId, Is.Not.Null);
            Assert.That(uploadResult.Uuid, Is.Not.Null);
        });
        _fileId = uploadResult.Uuid;
    }

    [Test]
    public async Task Download_CreateFolder_Overwrite_Success()
    {
        var downloadFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "download");
        await Client.DownloadAsync(_fileId, downloadFolderPath, true);
        Assert.That(File.Exists(Path.Combine(downloadFolderPath, "test.txt")), Is.True);
    }

    [Test]
    public async Task Download_Overwrite_ThrowDirectoryNotExist()
    {
        if (Directory.Exists("download"))
        {
            Directory.Delete("download", true);
        }

        var act = async () => await Client.DownloadAsync(_fileId, "download", true, false);
        
        await act.Should().ThrowAsync<DirectoryNotFoundException>();
    }

    [Test]
    public async Task Download_NotOverwrite_ThrowFileExist()
    {
        await Client.DownloadAsync(_fileId, "download", true, true);
        
        var act = async () => await Client.DownloadAsync(_fileId, "download");
        
        await act.Should().ThrowAsync<FileExistException>();
    }
    
    [Test]
    public async Task Download_ThrowFileNotFoundException()
    {
        var act = async () => await Client.DownloadAsync(Guid.NewGuid().ToString(), "download");

        await act.Should().ThrowAsync<FileNotFoundException>();
    }
}